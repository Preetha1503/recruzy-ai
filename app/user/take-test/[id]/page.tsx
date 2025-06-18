"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { submitTestResult } from "@/app/actions/results"
import { PermissionRequest } from "@/components/test/permission-request"
import { AIProctoring } from "@/components/test/ai-proctor"
import type { TestWithQuestions } from "@/lib/types"

interface TakeTestPageProps {
  params: { id: string }
}

interface TimeDisplay {
  hours: string
  minutes: string
  seconds: string
}

interface ViolationCounts {
  noFace: number
  multipleFaces: number
}

const VIOLATION_LIMITS = {
  NO_FACE: 5,
  MULTIPLE_FACES: 5,
  TAB_SWITCH: 5,
} as const

const DEFAULT_DURATION = 3600 // 60 minutes

export default function TakeTestPage({ params }: TakeTestPageProps) {
  const router = useRouter()
  const { toast } = useToast()
  const testId = params.id

  // Refs
  const videoRef = useRef<HTMLVideoElement>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pauseStartRef = useRef<number | null>(null)
  const startTimeRef = useRef<string>(new Date().toISOString())
  const mountedRef = useRef<boolean>(true)

  // Core test state
  const [test, setTest] = useState<TestWithQuestions | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<number>(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([])
  const [timeLeft, setTimeLeft] = useState<number>(DEFAULT_DURATION)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string>("")

  // UI state
  const [permissionsGranted, setPermissionsGranted] = useState<boolean>(false)
  const [showGuidelines, setShowGuidelines] = useState<boolean>(false)
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false)
  const [cameraActive, setCameraActive] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Test control state
  const [testPaused, setTestPaused] = useState<boolean>(false)
  const [pauseReason, setPauseReason] = useState<string | null>(null)
  const [obscureContent, setObscureContent] = useState<boolean>(false)

  // Dialog states
  const [showSubmitDialog, setShowSubmitDialog] = useState<boolean>(false)
  const [showTimeUpDialog, setShowTimeUpDialog] = useState<boolean>(false)
  const [showFullscreenWarning, setShowFullscreenWarning] = useState<boolean>(false)
  const [showTabWarning, setShowTabWarning] = useState<boolean>(false)
  const [showFaceWarning, setShowFaceWarning] = useState<boolean>(false)
  const [showMultipleFacesWarning, setShowMultipleFacesWarning] = useState<boolean>(false)
  const [showErrorDialog, setShowErrorDialog] = useState<boolean>(false)

  // Violation tracking
  const [tabSwitchCount, setTabSwitchCount] = useState<number>(0)
  const [violationCounts, setViolationCounts] = useState<ViolationCounts>({
    noFace: 0,
    multipleFaces: 0,
  })
  const [pendingViolation, setPendingViolation] = useState<"no_face" | "multiple_faces" | null>(null)
  const [clientErrorCount, setClientErrorCount] = useState<number>(0)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [pendingError, setPendingError] = useState<boolean>(false)

  // Utility functions
  const formatTime = useCallback((seconds: number): TimeDisplay => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0"),
    }
  }, [])

  const stopCameraStream = useCallback(() => {
    if (videoRef.current?.srcObject) {
      try {
        const stream = videoRef.current.srcObject as MediaStream
        stream.getTracks().forEach((track) => track.stop())
        videoRef.current.srcObject = null
        setCameraActive(false)
      } catch (err) {
        console.error("Error stopping camera:", err)
      }
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen()
      } catch (err) {
        console.error("Error exiting fullscreen:", err)
      }
    }
  }, [])

  const pauseTest = useCallback(
    (reason: string) => {
      if (!testPaused) {
        setTestPaused(true)
        setPauseReason(reason)
        pauseStartRef.current = Date.now()
      }
    },
    [testPaused],
  )

  const resumeTest = useCallback(() => {
    setTestPaused(false)
    setPauseReason(null)
    pauseStartRef.current = null
  }, [])

  // Main handlers
  const handleSubmitTest = useCallback(async () => {
    if (!test || !userId || isSubmitting || !mountedRef.current) return

    try {
      setIsSubmitting(true)
      stopCameraStream()

      const answersRecord: Record<string, number> = {}
      test.questions.forEach((question, index) => {
        if (answers[index] !== null && answers[index] !== undefined) {
          answersRecord[question.id] = answers[index] as number
        }
      })

      const formData = new FormData()
      formData.append("testId", testId)
      formData.append("answers", JSON.stringify(answersRecord))
      formData.append("timeTaken", String(test.duration * 60 - timeLeft))
      formData.append("startedAt", startTimeRef.current)
      formData.append("tabSwitchAttempts", String(tabSwitchCount))
      formData.append("noFaceViolations", String(violationCounts.noFace))
      formData.append("multipleFacesViolations", String(violationCounts.multipleFaces))
      formData.append("errorCount", String(clientErrorCount))

      const result = await submitTestResult(formData)

      if (!mountedRef.current) return

      if (result.error) {
        toast({
          title: "Submission Failed",
          description: result.error,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      await exitFullscreen()
      setPermissionsGranted(false)
      router.push(`/user/test-results/${result.resultId}`)
    } catch (err) {
      if (!mountedRef.current) return
      console.error("Error submitting test:", err)
      toast({
        title: "Submission Failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      })
      setIsSubmitting(false)
    }
  }, [
    test,
    userId,
    testId,
    timeLeft,
    tabSwitchCount,
    violationCounts,
    clientErrorCount,
    answers,
    isSubmitting,
    stopCameraStream,
    exitFullscreen,
    router,
    toast,
  ])

  const handleProctoringViolation = useCallback(
    (type: "no_face" | "multiple_faces") => {
      if (testPaused || !mountedRef.current) return

      setPendingViolation(type)

      if (type === "no_face") {
        pauseTest("Your face is not visible in the camera frame")
        setShowFaceWarning(true)
      } else {
        pauseTest("Multiple faces detected in the camera frame")
        setShowMultipleFacesWarning(true)
      }
    },
    [testPaused, pauseTest],
  )

  const handleClientError = useCallback(
    (errorMsg: string) => {
      if (testPaused || !mountedRef.current) return

      console.error("Client-side error:", errorMsg)
      setPendingError(true)
      setErrorMessage(errorMsg)
      pauseTest("A technical issue has been detected")
      setShowErrorDialog(true)
    },
    [testPaused, pauseTest],
  )

  const handleViolationAcknowledged = useCallback(
    (type: "no_face" | "multiple_faces") => {
      if (!mountedRef.current) return

      try {
        if (type === "no_face") {
          const newCount = violationCounts.noFace + 1
          setViolationCounts((prev) => ({ ...prev, noFace: newCount }))
          setShowFaceWarning(false)

          if (newCount >= VIOLATION_LIMITS.NO_FACE) {
            toast({
              title: "Test Auto-Submitted",
              description: "Face not detected multiple times. Test submitted automatically.",
              variant: "destructive",
            })
            setTimeout(() => handleSubmitTest(), 100)
            return
          }
        } else {
          const newCount = violationCounts.multipleFaces + 1
          setViolationCounts((prev) => ({ ...prev, multipleFaces: newCount }))
          setShowMultipleFacesWarning(false)

          if (newCount >= VIOLATION_LIMITS.MULTIPLE_FACES) {
            toast({
              title: "Test Auto-Submitted",
              description: "Multiple faces detected. Test submitted automatically.",
              variant: "destructive",
            })
            setTimeout(() => handleSubmitTest(), 100)
            return
          }
        }

        setPendingViolation(null)
        resumeTest()
      } catch (err) {
        console.error("Error handling violation:", err)
        resumeTest()
      }
    },
    [violationCounts, toast, handleSubmitTest, resumeTest],
  )

  const handleErrorAcknowledged = useCallback(() => {
    if (!mountedRef.current) return

    setClientErrorCount((prev) => prev + 1)
    setPendingError(false)
    setShowErrorDialog(false)
    resumeTest()
  }, [resumeTest])

  // Question navigation
  const handleAnswerSelect = useCallback(
    (questionIndex: number, optionIndex: number) => {
      if (testPaused || !mountedRef.current) return
      const newAnswers = [...answers]
      newAnswers[questionIndex] = optionIndex
      setAnswers(newAnswers)
    },
    [answers, testPaused],
  )

  const handleMarkForReview = useCallback(() => {
    if (testPaused || !mountedRef.current) return
    const newMarked = [...markedForReview]
    newMarked[currentQuestion] = !newMarked[currentQuestion]
    setMarkedForReview(newMarked)
  }, [markedForReview, currentQuestion, testPaused])

  const handleNavigateToQuestion = useCallback(
    (index: number) => {
      if (testPaused || !mountedRef.current) return
      setCurrentQuestion(index)
    },
    [testPaused],
  )

  const handleNextQuestion = useCallback(() => {
    if (testPaused || !test || !mountedRef.current) return
    if (currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }, [testPaused, test, currentQuestion])

  const handlePreviousQuestion = useCallback(() => {
    if (testPaused || !mountedRef.current) return
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }, [testPaused, currentQuestion])

  // Permission and fullscreen handlers
  const handlePermissionsGranted = useCallback(() => {
    setShowGuidelines(true)
  }, [])

  const handleGuidelinesAccepted = useCallback(() => {
    setShowGuidelines(false)
    setPermissionsGranted(true)
  }, [])

  const handleContinueTest = useCallback(() => {
    setShowFullscreenWarning(false)
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Failed to enter fullscreen:", err)
        toast({
          title: "Fullscreen Required",
          description: "Please enable fullscreen mode to continue.",
          variant: "destructive",
        })
      })
    }
  }, [toast])

  // Effects
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Global error handling
  useEffect(() => {
    if (!permissionsGranted) return

    const handleGlobalError = (event: ErrorEvent) => {
      event.preventDefault()
      handleClientError(`Error: ${event.message}`)
      return true
    }

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault()
      handleClientError(`Promise rejection: ${String(event.reason)}`)
    }

    window.addEventListener("error", handleGlobalError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    return () => {
      window.removeEventListener("error", handleGlobalError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [permissionsGranted, handleClientError])

  // Fetch test data
  useEffect(() => {
    if (!testId) {
      setError("Invalid test ID")
      setLoading(false)
      return
    }

    const cookies = document.cookie.split("; ").reduce(
      (acc, cookie) => {
        const [key, value] = cookie.split("=")
        acc[key] = value
        return acc
      },
      {} as Record<string, string>,
    )

    const currentUserId = cookies["user_id"]
    const currentUserName = cookies["user_name"] ? decodeURIComponent(cookies["user_name"]) : ""

    setUserName(currentUserName)

    if (!currentUserId) {
      setError("Please log in to access this test")
      setLoading(false)
      return
    }

    setUserId(currentUserId)

    const fetchTest = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/user/test?testId=${testId}&userId=${currentUserId}`)

        if (!response.ok) {
          if (response.status === 403) {
            setError("You are not authorized to access this test")
          } else {
            setError("Failed to load test")
          }
          return
        }

        const data = await response.json()

        if (data.error) {
          setError(data.error.includes("not assigned") ? "Test not assigned to you" : data.error)
          return
        }

        if (!data.test) {
          setError("Test not found")
          return
        }

        if (!mountedRef.current) return

        setTest(data.test)
        setTimeLeft(data.test.duration * 60)
        setAnswers(new Array(data.test.questions.length).fill(null))
        setMarkedForReview(new Array(data.test.questions.length).fill(false))
      } catch (err) {
        console.error("Error fetching test:", err)
        if (mountedRef.current) {
          setError("Failed to load test")
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false)
        }
      }
    }

    fetchTest()
  }, [testId])

  // Timer management
  useEffect(() => {
    if (!test || !permissionsGranted) return

    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    if (!testPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            if (mountedRef.current) {
              setShowTimeUpDialog(true)
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [test, permissionsGranted, testPaused])

  // Fullscreen and permissions
  useEffect(() => {
    if (permissionsGranted) {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Failed to enter fullscreen:", err)
          toast({
            title: "Fullscreen Required",
            description: "Please enable fullscreen mode.",
            variant: "destructive",
          })
        })
      }
    }
  }, [permissionsGranted, toast])

  // Tab visibility monitoring
  useEffect(() => {
    if (!permissionsGranted) return

    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible"

      if (!isVisible && mountedRef.current) {
        const newCount = tabSwitchCount + 1
        setTabSwitchCount(newCount)
        setShowTabWarning(true)
        setObscureContent(true)

        if (newCount >= VIOLATION_LIMITS.TAB_SWITCH) {
          toast({
            title: "Test Auto-Submitted",
            description: "Multiple tab switching violations detected.",
            variant: "destructive",
          })
          setTimeout(() => handleSubmitTest(), 100)
        }
      } else {
        setObscureContent(false)
      }
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (permissionsGranted) {
        e.preventDefault()
        e.returnValue = "Are you sure you want to leave? Your progress will be lost."
        return e.returnValue
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [permissionsGranted, tabSwitchCount, handleSubmitTest, toast])

  // Fullscreen monitoring
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)
      if (permissionsGranted && !isCurrentlyFullscreen && mountedRef.current) {
        setShowFullscreenWarning(true)
      }
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F11" || event.key === "Escape") {
        event.preventDefault()
        if (permissionsGranted && mountedRef.current) {
          setShowFullscreenWarning(true)
        }
      }
    }

    const handleCopy = (event: Event) => {
      event.preventDefault()
      toast({
        title: "Copying Disabled",
        description: "Copying is not allowed during the test.",
        variant: "destructive",
      })
    }

    const handleContextMenu = (event: Event) => {
      event.preventDefault()
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("copy", handleCopy)
    document.addEventListener("contextmenu", handleContextMenu)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("copy", handleCopy)
      document.removeEventListener("contextmenu", handleContextMenu)
    }
  }, [permissionsGranted, toast])

  // Camera initialization
  useEffect(() => {
    let cameraStream: MediaStream | null = null

    if (permissionsGranted && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          cameraStream = stream
          if (videoRef.current && mountedRef.current) {
            videoRef.current.srcObject = stream
            setCameraActive(true)
          }
        })
        .catch((err) => {
          console.error("Camera access error:", err)
          if (mountedRef.current) {
            toast({
              title: "Camera Error",
              description: "Failed to access camera. Please check permissions.",
              variant: "destructive",
            })
          }
        })
    }

    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop())
      }
      if (videoRef.current?.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream
          stream.getTracks().forEach((track) => track.stop())
          videoRef.current.srcObject = null
        } catch (err) {
          console.error("Error stopping camera:", err)
        }
      }
    }
  }, [permissionsGranted, toast])

  // Render loading state
  if (loading) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
        </div>
      </DashboardLayout>
    )
  }

  // Render error state
  if (error || !test) {
    return (
      <DashboardLayout requiredRole="user">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Test not found"}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/user/active-tests">Back to Active Tests</Link>
        </Button>
      </DashboardLayout>
    )
  }

  // Calculate display values
  const progress = ((currentQuestion + 1) / test.questions.length) * 100
  const answeredCount = answers.filter((a) => a !== null).length
  const question = test.questions[currentQuestion]
  const time = formatTime(timeLeft)

  return (
    <DashboardLayout requiredRole="user" className={isFullscreen ? "ml-0" : ""}>
      {!permissionsGranted && !showGuidelines ? (
        <PermissionRequest onPermissionsGranted={handlePermissionsGranted} />
      ) : showGuidelines ? (
        <AlertDialog open={showGuidelines} onOpenChange={setShowGuidelines}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Test Guidelines</AlertDialogTitle>
              <AlertDialogDescription>
                Please read the following guidelines before starting the test:
                <ul className="list-disc pl-5 mt-2">
                  <li>Ensure you are in a quiet, well-lit environment.</li>
                  <li>The test must be taken in fullscreen mode.</li>
                  <li>Copying or using external resources is prohibited.</li>
                  <li>Your webcam must remain active for proctoring purposes.</li>
                  <li>Your face must be visible in the camera at all times.</li>
                  <li>Only one person should be visible in the camera frame.</li>
                  <li>The test duration is {test.duration} minutes.</li>
                  <li>Click "Understood" to start the test.</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={handleGuidelinesAccepted}
                className="bg-purple-700 hover:bg-purple-800 text-white"
              >
                Understood
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      ) : (
        <div className="flex">
          {/* Main Content */}
          <div
            className={`flex-1 space-y-6 p-4 mr-64 transition-opacity duration-300 ${
              obscureContent || testPaused ? "opacity-20 pointer-events-none" : "opacity-100"
            }`}
            style={{ userSelect: "none" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">{test.title}</h1>
              <div className="flex items-center gap-2 text-gray-800">
                <span>Time Left</span>
                <span className="font-mono text-lg font-medium">
                  {time.hours}:{time.minutes}:{time.seconds}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>
                Question {currentQuestion + 1} of {test.questions.length}
              </div>
            </div>

            <Progress value={progress} className="h-2 bg-gray-200" />

            {/* Question Card */}
            <Card className="border-gray-200 max-h-[60vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800">Question {currentQuestion + 1}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-700">{question.text}</p>
                  {question.options.map((option, index) => (
                    <div
                      key={index}
                      className={`flex items-center rounded-md border p-3 cursor-pointer transition-colors ${
                        answers[currentQuestion] === index
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                      } ${testPaused ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => handleAnswerSelect(currentQuestion, index)}
                    >
                      <div
                        className={`mr-3 flex h-5 w-5 items-center justify-center rounded-sm border ${
                          answers[currentQuestion] === index ? "border-blue-500 bg-blue-500" : "border-gray-300"
                        }`}
                      >
                        {answers[currentQuestion] === index && <CheckCircle className="h-4 w-4 text-white" />}
                      </div>
                      <span>{option}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleMarkForReview}
                  disabled={testPaused}
                  className={`rounded-full px-6 py-2 text-white ${
                    markedForReview[currentQuestion] ? "bg-gray-500" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  {markedForReview[currentQuestion] ? "Marked for Review" : "Mark for Review"}
                </Button>
                <Button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestion === 0 || testPaused}
                  className="rounded-full px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNextQuestion}
                  disabled={currentQuestion === test.questions.length - 1 || testPaused}
                  className="rounded-full px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Next
                </Button>
              </div>
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={testPaused || isSubmitting}
                className="rounded-full px-6 py-2 bg-green-500 hover:bg-green-600 text-white"
              >
                {isSubmitting ? "Submitting..." : "Submit Test"}
              </Button>
            </div>

            {/* Legend */}
            <div className="flex gap-4 text-sm text-gray-600 mt-2">
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-blue-500"></div>
                <span>Current</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-white border border-gray-300"></div>
                <span>Not Attempted</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-green-500"></div>
                <span>Answered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-orange-500"></div>
                <span>Not Answered</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="h-4 w-4 rounded-full bg-gray-500"></div>
                <span>Review</span>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="fixed top-0 right-0 w-64 h-screen bg-gray-100 border-l border-gray-200 overflow-y-auto p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((_, idx) => {
                  const isCurrent = idx === currentQuestion
                  const isAnswered = answers[idx] !== null
                  const isMarkedForReview = markedForReview[idx]

                  let bgColor = "bg-white border border-gray-300"
                  if (isMarkedForReview) {
                    bgColor = "bg-gray-500 text-white"
                  } else if (isCurrent) {
                    bgColor = "bg-blue-500 text-white"
                  } else if (isAnswered) {
                    bgColor = "bg-green-500 text-white"
                  } else {
                    bgColor = "bg-orange-500 text-white"
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleNavigateToQuestion(idx)}
                      disabled={testPaused}
                      className={`h-10 w-10 flex items-center justify-center rounded-md ${bgColor} hover:bg-opacity-80 transition-colors ${
                        testPaused ? "opacity-50 cursor-not-allowed" : ""
                      }`}
                    >
                      {idx + 1}
                    </button>
                  )
                })}
              </div>

              {/* Video Feed */}
              <div className="mt-4 relative">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  className={`border border-gray-300 rounded-md w-full h-32 object-cover ${
                    !cameraActive ? "bg-gray-800" : ""
                  }`}
                />

                {!cameraActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-800 bg-opacity-80 text-white rounded-md">
                    <p className="text-sm font-medium">Camera disabled</p>
                  </div>
                )}

                <AIProctoring
                  videoRef={videoRef}
                  onViolation={handleProctoringViolation}
                  isActive={permissionsGranted && cameraActive}
                  userName={userName}
                />
              </div>

              {/* Test Status */}
              {testPaused && (
                <div className="mt-4 bg-yellow-100 border border-yellow-300 rounded-md p-3">
                  <div className="flex items-center gap-2 text-yellow-800 font-medium mb-2">
                    <Clock className="h-5 w-5" />
                    <span>Test Paused</span>
                  </div>
                  <p className="text-sm text-yellow-700">
                    {pauseReason || "The test has been paused. Please address the issue to continue."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Dialogs */}
      <AlertDialog open={showFullscreenWarning} onOpenChange={setShowFullscreenWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Fullscreen Required</AlertDialogTitle>
            <AlertDialogDescription>
              The test must be taken in fullscreen mode. Please continue in fullscreen mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleContinueTest} className="bg-purple-700 hover:bg-purple-800 text-white">
              Continue Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test</AlertDialogTitle>
            <AlertDialogDescription>
              {answeredCount < test.questions.length ? (
                <>
                  You have {test.questions.length - answeredCount} unanswered questions. Are you sure you want to submit
                  the test? You won't be able to change your answers after submission.
                </>
              ) : (
                <>
                  Are you sure you want to submit the test? You won't be able to change your answers after submission.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-purple-200 text-purple-700">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                stopCameraStream()
                handleSubmitTest()
                setShowSubmitDialog(false)
              }}
              disabled={isSubmitting}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              {isSubmitting ? "Submitting..." : "Submit Test"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showTimeUpDialog} onOpenChange={setShowTimeUpDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Time's Up!</AlertDialogTitle>
            <AlertDialogDescription>
              Your time for this test has expired. Your answers will be automatically submitted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                stopCameraStream()
                handleSubmitTest()
                setShowTimeUpDialog(false)
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              View Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Tab Switching Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You have switched away from the test tab. This activity is monitored and may be flagged as a violation.
              {tabSwitchCount > 1 && (
                <p className="mt-2 font-semibold text-red-600">
                  This is your {tabSwitchCount}
                  {tabSwitchCount === 2 ? "nd" : tabSwitchCount === 3 ? "rd" : "th"} violation.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowTabWarning(false)
                setObscureContent(false)
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch((err) => {
                    console.error("Failed to re-enter fullscreen:", err)
                  })
                }
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              Return to Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showFaceWarning} onOpenChange={setShowFaceWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Face Not Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Your face is not visible in the camera frame. Please ensure your face is clearly visible.
              {violationCounts.noFace > 0 && (
                <p className="mt-2 font-semibold text-red-600">
                  This is your {violationCounts.noFace + 1} violation. Multiple violations may result in automatic test
                  submission.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (pendingViolation === "no_face") {
                  handleViolationAcknowledged("no_face")
                } else {
                  setShowFaceWarning(false)
                }
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showMultipleFacesWarning} onOpenChange={setShowMultipleFacesWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Multiple Faces Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Multiple faces have been detected in the camera frame. Only the test taker should be visible.
              {violationCounts.multipleFaces > 0 && (
                <p className="mt-2 font-semibold text-red-600">
                  This is your {violationCounts.multipleFaces + 1} violation. Another violation will result in automatic
                  test submission.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (pendingViolation === "multiple_faces") {
                  handleViolationAcknowledged("multiple_faces")
                } else {
                  setShowMultipleFacesWarning(false)
                }
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Technical Issue Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              A technical issue has been detected. The test has been paused to protect your progress.
              <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm font-mono overflow-x-auto max-h-32">
                {errorMessage || "Unknown error"}
              </div>
              {clientErrorCount > 0 && (
                <p className="mt-2 font-medium text-amber-600">
                  This is the {clientErrorCount + 1} technical issue detected.
                </p>
              )}
              <p className="mt-2">Click "Continue Test" to resume. If issues persist, please contact support.</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                if (pendingError) {
                  handleErrorAcknowledged()
                } else {
                  setShowErrorDialog(false)
                }
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              Continue Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  )
}
