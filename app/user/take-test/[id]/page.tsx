"use client"
import { useState, useEffect, useRef, useCallback } from "react"
import type { TestWithQuestions } from "@/lib/types"
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
import { AlertCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { submitTestResult } from "@/app/actions/results"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import { PermissionRequest } from "@/components/test/permission-request"
import { AIProctoring } from "@/components/test/ai-proctor"
import { TabSwitchMonitor } from "@/components/test/tab-switch-monitor"

export default function TakeTest({ params }: { params: { id: string } }) {
  const router = useRouter()
  const testId = params.id
  const { toast } = useToast()

  const [test, setTest] = useState<TestWithQuestions | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>([])
  const [markedForReview, setMarkedForReview] = useState<boolean[]>([])
  const [timeLeft, setTimeLeft] = useState(3600) // Default 60 minutes in seconds
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false)
  const [isTimeUpDialogOpen, setIsTimeUpDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [startTime] = useState(new Date().toISOString())
  const [userId, setUserId] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [permissionsGranted, setPermissionsGranted] = useState(false)
  const [showGuidelines, setShowGuidelines] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [fullscreenWarning, setFullscreenWarning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [showSidebar, setShowSidebar] = useState(true)
  const [tabSwitchAttempts, setTabSwitchAttempts] = useState(0)
  const [isTabVisible, setIsTabVisible] = useState(true)
  const [showTabWarning, setShowTabWarning] = useState(false)
  const [obscureContent, setObscureContent] = useState(false)
  const [proctorViolations, setProctoringViolations] = useState<{
    noFace: number
    multipleFaces: number
  }>({ noFace: 0, multipleFaces: 0 })
  const [showFaceWarning, setShowFaceWarning] = useState(false)
  const [showMultipleFacesWarning, setShowMultipleFacesWarning] = useState(false)
  const [violationType, setViolationType] = useState<"no_face" | "multiple_faces" | null>(null)
  const [cameraActive, setCameraActive] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New states for test pausing
  const [testPaused, setTestPaused] = useState(false)
  const [pauseReason, setPauseReason] = useState<string | null>(null)
  const [pendingViolation, setPendingViolation] = useState<"no_face" | "multiple_faces" | null>(null)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const pauseStartTimeRef = useRef<number | null>(null)
  const pauseTotalTimeRef = useRef<number>(0)

  // New states for client-side exception handling
  const [clientErrors, setClientErrors] = useState(0)
  const [showErrorDialog, setShowErrorDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [pendingError, setPendingError] = useState(false)

  // Increased thresholds for violations
  const MAX_NO_FACE_VIOLATIONS = 3
  const MAX_MULTIPLE_FACES_VIOLATIONS = 3
  const MAX_TAB_SWITCH_VIOLATIONS = 3

  // New states for test status
  const [testStarted, setTestStarted] = useState(false)
  const [testSubmitted, setTestSubmitted] = useState(false)

  const handleSubmit = useCallback(async () => {
    if (!test || !userId || isSubmitting) return

    try {
      setIsSubmitting(true)

      // Stop the camera stream FIRST before doing anything else
      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream
          stream.getTracks().forEach((track) => {
            track.stop()
            console.log("Camera track stopped successfully")
          })
          videoRef.current.srcObject = null
          setCameraActive(false)
        } catch (err) {
          console.error("Error stopping camera:", err)
        }
      }

      const answersRecord: Record<string, number> = {}
      test.questions.forEach((question, index) => {
        if (answers[index] !== null) {
          answersRecord[question.id] = answers[index] as number
        }
      })

      const formData = new FormData()
      formData.append("testId", testId)
      formData.append("answers", JSON.stringify(answersRecord))
      formData.append("timeTaken", String(test.duration * 60 - timeLeft))
      formData.append("startedAt", startTime)
      formData.append("tabSwitchAttempts", String(tabSwitchAttempts))

      // Add proctoring violations to the form data
      formData.append("noFaceViolations", String(proctorViolations.noFace))
      formData.append("multipleFacesViolations", String(proctorViolations.multipleFaces))

      const result = await submitTestResult(formData)

      if (result.error) {
        console.error("Error submitting test:", result.error)
        toast({
          title: "Failed to submit test",
          description: result.error,
          variant: "destructive",
        })
        setIsSubmitting(false)
        return
      }

      // Exit fullscreen mode
      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen()
        } catch (err) {
          console.error("Error exiting fullscreen:", err)
        }
      }

      // Reset permissions
      setPermissionsGranted(false)

      // Navigate to results page
      router.push(`/user/test-results/${result.resultId}`)
    } catch (err) {
      console.error("Error submitting test:", err)
      toast({
        title: "Failed to submit test",
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
    startTime,
    tabSwitchAttempts,
    proctorViolations,
    router,
    toast,
    answers,
    isSubmitting,
  ])

  const handleTabSwitchViolation = useCallback(() => {
    console.log("Tab switch violation detected - auto-submitting test")
    // Auto-submit the test
    handleSubmit()
  }, [handleSubmit])

  const handleProctoringViolation = useCallback(
    (type: "no_face" | "multiple_faces") => {
      setViolationType(type)

      // Don't process new violations if the test is already paused
      if (testPaused) return

      // Pause the test and set pending violation
      setTestPaused(true)
      setPendingViolation(type)

      // Store the time when the test was paused
      pauseStartTimeRef.current = Date.now()

      // Set pause reason based on violation type
      if (type === "no_face") {
        setPauseReason("Your face is not visible in the camera frame")
        setShowFaceWarning(true)
      } else if (type === "multiple_faces") {
        setPauseReason("Multiple faces detected in the camera frame")
        setShowMultipleFacesWarning(true)
      }
    },
    [testPaused],
  )

  // Handle client-side exceptions
  const handleClientError = useCallback(
    (errorMsg: string) => {
      // Don't process new errors if the test is already paused
      if (testPaused) return

      console.error("Client-side exception:", errorMsg)

      // Pause the test
      setTestPaused(true)
      setPauseReason("A technical issue has been detected")
      setPendingError(true)

      // Store the time when the test was paused
      pauseStartTimeRef.current = Date.now()

      // Set error message and show dialog
      setErrorMessage(errorMsg)
      setShowErrorDialog(true)
    },
    [testPaused],
  )

  // Handle acknowledging an error and resuming the test
  const handleErrorAcknowledged = useCallback(() => {
    // Increment the error count
    setClientErrors((prev) => prev + 1)

    // Clear pending error
    setPendingError(false)
    setShowErrorDialog(false)

    // Calculate pause duration
    if (pauseStartTimeRef.current) {
      const pauseDuration = Date.now() - pauseStartTimeRef.current
      pauseTotalTimeRef.current += pauseDuration
      pauseStartTimeRef.current = null
    }

    // Resume the test
    setTestPaused(false)
    setPauseReason(null)
  }, [])

  // Handle acknowledging a violation and resuming the test
  const handleViolationAcknowledged = useCallback(
    (type: "no_face" | "multiple_faces") => {
      try {
        // Only increment the violation count after user acknowledgment
        if (type === "no_face") {
          const newNoFaceCount = proctorViolations.noFace + 1
          setProctoringViolations((prev) => ({ ...prev, noFace: newNoFaceCount }))
          setShowFaceWarning(false)

          // Auto-submit after MAX_NO_FACE_VIOLATIONS violations
          if (newNoFaceCount >= MAX_NO_FACE_VIOLATIONS) {
            toast({
              title: "Test auto-submitted",
              description: "Face not detected multiple times. Your test has been automatically submitted.",
              variant: "destructive",
            })
            // Use setTimeout to ensure state updates before submission
            setTimeout(() => handleSubmit(), 100)
            return // Don't resume if auto-submitting
          }
        } else if (type === "multiple_faces") {
          const newMultipleFacesCount = proctorViolations.multipleFaces + 1
          setProctoringViolations((prev) => ({ ...prev, multipleFaces: newMultipleFacesCount }))
          setShowMultipleFacesWarning(false)

          // Auto-submit after MAX_MULTIPLE_FACES_VIOLATIONS violations
          if (newMultipleFacesCount >= MAX_MULTIPLE_FACES_VIOLATIONS) {
            toast({
              title: "Test auto-submitted",
              description: "Multiple faces detected. Your test has been automatically submitted.",
              variant: "destructive",
            })
            // Use setTimeout to ensure state updates before submission
            setTimeout(() => handleSubmit(), 100)
            return // Don't resume if auto-submitting
          }
        }

        // Calculate pause duration
        if (pauseStartTimeRef.current) {
          const pauseDuration = Date.now() - pauseStartTimeRef.current
          pauseTotalTimeRef.current += pauseDuration
          pauseStartTimeRef.current = null
        }

        // Resume the test
        setTestPaused(false)
        setPauseReason(null)
        setPendingViolation(null)
      } catch (err) {
        console.error("Error handling violation acknowledgment:", err)
        // Fallback to resume the test even if there's an error
        setTestPaused(false)
        setPauseReason(null)
        setPendingViolation(null)
      }
    },
    [handleSubmit, proctorViolations, toast, MAX_MULTIPLE_FACES_VIOLATIONS, MAX_NO_FACE_VIOLATIONS],
  )

  // Set up global error handler
  useEffect(() => {
    if (!permissionsGranted) return

    // Global error handler for uncaught exceptions
    const handleGlobalError = (event: ErrorEvent) => {
      event.preventDefault()
      handleClientError(`An error occurred: ${event.message}`)
      return true // Prevent default error handling
    }

    // Global unhandled promise rejection handler
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      event.preventDefault()
      handleClientError(`A promise rejection occurred: ${event.reason}`)
    }

    // Add event listeners
    window.addEventListener("error", handleGlobalError)
    window.addEventListener("unhandledrejection", handleUnhandledRejection)

    // Clean up
    return () => {
      window.removeEventListener("error", handleGlobalError)
      window.removeEventListener("unhandledrejection", handleUnhandledRejection)
    }
  }, [permissionsGranted, handleClientError])

  useEffect(() => {
    // Get the current user ID from cookies
    const cookies = document.cookie.split("; ")
    const userIdCookie = cookies.find((cookie) => cookie.startsWith("user_id="))
    const currentUserId = userIdCookie ? userIdCookie.split("=")[1] : null

    // Get username from cookies if available
    const userNameCookie = cookies.find((cookie) => cookie.startsWith("user_name="))
    const currentUserName = userNameCookie ? userNameCookie.split("=")[1] : null

    if (currentUserName) {
      setUserName(decodeURIComponent(currentUserName))
    }

    if (!currentUserId) {
      setError("User ID not found. Please log in again.")
      setLoading(false)
      return
    }

    setUserId(currentUserId)

    const fetchTest = async () => {
      try {
        setLoading(true)
        setError(null)

        const testResponse = await fetch(`/api/user/test?testId=${testId}`)
        if (!testResponse.ok) {
          throw new Error(`Failed to fetch test: ${testResponse.statusText}`)
        }

        const testData = await testResponse.json()
        if (testData.error) {
          throw new Error(testData.error)
        }

        if (!testData.test) {
          setError("Test not found")
          setLoading(false)
          return
        }

        setTest(testData.test)
        setTimeLeft(testData.test.duration * 60)
        setAnswers(new Array(testData.test.questions.length).fill(null))
        setMarkedForReview(new Array(testData.test.questions.length).fill(false))
      } catch (err) {
        console.error("Error fetching test:", err)
        setError(err instanceof Error ? err.message : "Failed to load test")
      } finally {
        setLoading(false)
      }
    }

    fetchTest()
  }, [testId])

  // Timer effect - properly handles pausing
  useEffect(() => {
    if (!test || !permissionsGranted) return

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current)
    }

    // Only run the timer when the test is not paused
    if (!testPaused) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current)
            setIsTimeUpDialogOpen(true)
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

  useEffect(() => {
    if (permissionsGranted) {
      // Hide sidebar and enter fullscreen when test starts
      setShowSidebar(false)
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
          console.error("Failed to enter fullscreen:", err)
          toast({
            title: "Fullscreen Required",
            description: "Failed to enter fullscreen mode. Please enable fullscreen to continue.",
            variant: "destructive",
          })
        })
      }
      setTestStarted(true)
    }
  }, [permissionsGranted, toast])

  useEffect(() => {
    if (!permissionsGranted) return

    // Handle tab visibility change
    const handleVisibilityChange = () => {
      const isVisible = document.visibilityState === "visible"
      setIsTabVisible(isVisible)

      if (!isVisible && permissionsGranted) {
        // User switched tabs or minimized window
        const newAttempts = tabSwitchAttempts + 1
        setTabSwitchAttempts(newAttempts)
        setShowTabWarning(true)
        setObscureContent(true) // Obscure the test content

        // Log the attempt
        console.log("Tab switch attempt detected")

        // Auto-submit after MAX_TAB_SWITCH_VIOLATIONS attempts
        if (newAttempts >= MAX_TAB_SWITCH_VIOLATIONS) {
          toast({
            title: "Test auto-submitted",
            description: "Multiple tab switching violations detected. Your test has been automatically submitted.",
            variant: "destructive",
          })
          setTimeout(() => handleSubmit(), 100)
        }
      } else {
        setObscureContent(false) // Restore the test content
      }
    }

    // Handle before unload (page refresh or close)
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (permissionsGranted) {
        e.preventDefault()
        e.returnValue = "Are you sure you want to leave? Your test progress will be lost."
        return e.returnValue
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)
    window.addEventListener("beforeunload", handleBeforeUnload)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      window.removeEventListener("beforeunload", handleBeforeUnload)
    }
  }, [permissionsGranted, tabSwitchAttempts, handleSubmit, toast, MAX_TAB_SWITCH_VIOLATIONS])

  useEffect(() => {
    // Prevent exiting fullscreen and handle fullscreen changes
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement
      setIsFullscreen(isCurrentlyFullscreen)
      if (permissionsGranted && !isCurrentlyFullscreen) {
        // Show warning if fullscreen is exited
        setFullscreenWarning(true)
      }
    }

    // Prevent F11 and Esc key actions
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "F11" || event.key === "Escape") {
        event.preventDefault()
        if (permissionsGranted) {
          setFullscreenWarning(true)
        }
      }
    }

    // Prevent copying
    const handleCopy = (event: Event) => {
      event.preventDefault()
      toast({
        title: "Copying Disabled",
        description: "Copying is not allowed during the test.",
        variant: "destructive",
      })
    }

    // Prevent context menu (right-click)
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

  // Initialize camera when permissions are granted
  useEffect(() => {
    let cameraStream: MediaStream | null = null

    if (permissionsGranted && videoRef.current) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          cameraStream = stream
          if (videoRef.current) {
            videoRef.current.srcObject = stream
            setCameraActive(true)
          }
        })
        .catch((err) => {
          console.error("Error accessing camera:", err)
          toast({
            title: "Camera Error",
            description: "Failed to access camera. Please check your permissions.",
            variant: "destructive",
          })
        })
    }

    return () => {
      // Clean up camera stream when component unmounts or permissions change
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => {
          track.stop()
          console.log("Camera track stopped on cleanup")
        })
      }

      if (videoRef.current && videoRef.current.srcObject) {
        try {
          const stream = videoRef.current.srcObject as MediaStream
          stream.getTracks().forEach((track) => {
            track.stop()
            console.log("Camera track stopped from videoRef on cleanup")
          })
          videoRef.current.srcObject = null
        } catch (err) {
          console.error("Error stopping camera stream:", err)
        }
      }
    }
  }, [permissionsGranted, toast])

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const mins = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return {
      hours: hours.toString().padStart(2, "0"),
      minutes: mins.toString().padStart(2, "0"),
      seconds: secs.toString().padStart(2, "0"),
    }
  }

  const handleAnswerSelect = (questionIndex: number, optionIndex: number) => {
    // Prevent interaction if test is paused
    if (testPaused) return

    const newAnswers = [...answers]
    newAnswers[questionIndex] = optionIndex
    setAnswers(newAnswers)
  }

  const handleMarkForReview = () => {
    // Prevent interaction if test is paused
    if (testPaused) return

    const newMarkedForReview = [...markedForReview]
    newMarkedForReview[currentQuestion] = !newMarkedForReview[currentQuestion]
    setMarkedForReview(newMarkedForReview)
  }

  const handleNext = () => {
    // Prevent interaction if test is paused
    if (testPaused) return

    if (test && currentQuestion < test.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevious = () => {
    // Prevent interaction if test is paused
    if (testPaused) return

    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleQuestionChange = (index: number) => {
    // Prevent interaction if test is paused
    if (testPaused) return

    setCurrentQuestion(index)
  }

  // Handle continuing test after fullscreen warning
  const handleContinueTest = () => {
    setFullscreenWarning(false)
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error("Failed to re-enter fullscreen:", err)
        toast({
          title: "Fullscreen Required",
          description: "Failed to enter fullscreen mode. Please enable fullscreen to continue.",
          variant: "destructive",
        })
      })
    }
  }

  // Handle guidelines acknowledgment
  const handleGuidelinesAcknowledged = () => {
    setShowGuidelines(false)
    setPermissionsGranted(true)
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
        </div>
      </DashboardLayout>
    )
  }

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

  const progress = ((currentQuestion + 1) / test.questions.length) * 100
  const answeredCount = answers.filter((a) => a !== null).length
  const question = test.questions[currentQuestion]
  const time = formatTime(timeLeft)

  return (
    <DashboardLayout requiredRole="user" className={isFullscreen ? "ml-0" : ""}>
      {!permissionsGranted && !showGuidelines ? (
        <PermissionRequest onPermissionsGranted={() => setShowGuidelines(true)} />
      ) : showGuidelines ? (
        <AlertDialog open={showGuidelines} onOpenChange={setShowGuidelines}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Test Guidelines</AlertDialogTitle>
              <AlertDialogDescription>
                Please read the following guidelines before starting the test:
                <ul className="list-disc pl-5 mt-2">
                  <li>Ensure you are in a quiet, well-lit environment.</li>
                  <li>The test must be taken in fullscreen mode. Attempting to exit fullscreen is not allowed.</li>
                  <li>Copying or using external resources is prohibited.</li>
                  <li>Your webcam must remain active for proctoring purposes.</li>
                  <li>AI proctoring will monitor your presence during the test.</li>
                  <li>Your face must be visible in the camera at all times.</li>
                  <li>Only one person (you) should be visible in the camera frame.</li>
                  <li>
                    The test duration is {test.duration} minutes. Unanswered questions will be marked as incorrect.
                  </li>
                  <li>
                    The test will pause if any violations or technical issues are detected, and you must acknowledge
                    them to continue.
                  </li>
                  <li>Click "Understood" to start the test.</li>
                </ul>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction
                onClick={handleGuidelinesAcknowledged}
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
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-800">{test.title}</h1>
              <div className="flex items-center gap-2 text-gray-800">
                <span>Time Left</span>
                <span className="font-mono text-lg font-medium">
                  {time.hours}:{time.minutes}:{time.seconds}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-600">
              <div>Question {currentQuestion + 1}</div>
            </div>

            <Progress value={progress} className="h-2 bg-gray-200" indicatorClassName="bg-blue-500" />

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

            {/* Navigation Buttons */}
            <div className="flex justify-between items-center mt-4">
              <div className="flex gap-3">
                <Button
                  onClick={handleMarkForReview}
                  disabled={testPaused}
                  className={`rounded-full px-6 py-2 text-white ${
                    markedForReview[currentQuestion] ? "bg-gray-500" : "bg-red-500 hover:bg-red-600"
                  }`}
                >
                  Mark for Review
                </Button>
                <Button
                  onClick={handlePrevious}
                  disabled={currentQuestion === 0 || testPaused}
                  className="rounded-full px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Previous
                </Button>
                <Button
                  onClick={handleNext}
                  disabled={currentQuestion === test.questions.length - 1 || testPaused}
                  className="rounded-full px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white"
                >
                  Next
                </Button>
              </div>
              <Button
                onClick={() => setIsSubmitDialogOpen(true)}
                disabled={testPaused || isSubmitting}
                className="rounded-full px-6 py-2 bg-green-500 hover:bg-green-600 text-white"
              >
                Submit Test
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

          {/* Sidebar with Questions and Video */}
          <div className="fixed top-0 right-0 w-64 h-screen bg-gray-100 border-l border-gray-200 overflow-y-auto p-4">
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Questions</h3>
              <div className="grid grid-cols-5 gap-2">
                {test.questions.map((_, idx) => {
                  const isCurrent = idx === currentQuestion
                  const isAnswered = answers[idx] !== null
                  const isMarkedForReview = markedForReview[idx]
                  let bgColor = "bg-white border border-gray-300" // Not Attempted
                  if (isMarkedForReview)
                    bgColor = "bg-gray-500 text-white" // Review
                  else if (isCurrent)
                    bgColor = "bg-blue-500 text-white" // Current
                  else if (isAnswered)
                    bgColor = "bg-green-500 text-white" // Answered
                  else if (answers[idx] === null) bgColor = "bg-orange-500 text-white" // Not Answered

                  return (
                    <button
                      key={idx}
                      onClick={() => handleQuestionChange(idx)}
                      disabled={testPaused}
                      className={`h-10 w-10 flex items-center justify-center rounded-md ${bgColor} hover:bg-opacity-80 transition-colors ${testPaused ? "opacity-50 cursor-not-allowed" : ""}`}
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
                  className={`border border-gray-300 rounded-md w-full h-32 object-cover ${!cameraActive ? "bg-gray-800" : ""}`}
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
                  userName={userName || undefined}
                />
              </div>

              {/* Test Paused Indicator */}
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

      <TabSwitchMonitor isActive={testStarted && !testSubmitted} onViolation={handleTabSwitchViolation} />

      {/* Fullscreen Warning Dialog */}
      <AlertDialog open={fullscreenWarning} onOpenChange={setFullscreenWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Fullscreen Required</AlertDialogTitle>
            <AlertDialogDescription>
              The test must be taken in fullscreen mode. Attempting to exit fullscreen is not allowed. Please continue
              in fullscreen mode.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleContinueTest} className="bg-purple-700 hover:bg-purple-800 text-white">
              Continue Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update the submit test dialog to properly clean up camera resources */}
      <AlertDialog open={isSubmitDialogOpen} onOpenChange={setIsSubmitDialogOpen}>
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
                // Stop camera before submitting
                if (videoRef.current && videoRef.current.srcObject) {
                  try {
                    const stream = videoRef.current.srcObject as MediaStream
                    stream.getTracks().forEach((track) => track.stop())
                    videoRef.current.srcObject = null
                    setCameraActive(false)
                  } catch (err) {
                    console.error("Error stopping camera on submit:", err)
                  }
                }

                handleSubmit()
                setShowSidebar(true) // Show sidebar after submission
                setPermissionsGranted(false) // Reset permissions after submission
                setTestSubmitted(true)
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              Submit Test
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Update the time-up dialog to properly clean up camera resources */}
      <AlertDialog open={isTimeUpDialogOpen} onOpenChange={setIsTimeUpDialogOpen}>
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
                // Stop camera before submitting
                if (videoRef.current && videoRef.current.srcObject) {
                  try {
                    const stream = videoRef.current.srcObject as MediaStream
                    stream.getTracks().forEach((track) => track.stop())
                    videoRef.current.srcObject = null
                    setCameraActive(false)
                  } catch (err) {
                    console.error("Error stopping camera on time up:", err)
                  }
                }

                handleSubmit()
                setShowSidebar(true) // Show sidebar after time's up submission
                setPermissionsGranted(false) // Reset permissions after time's up submission
                setTestSubmitted(true)
              }}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              View Results
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Tab Switch Warning Dialog */}
      <AlertDialog open={showTabWarning} onOpenChange={setShowTabWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Tab Switching Detected</AlertDialogTitle>
            <AlertDialogDescription>
              You have switched away from the test tab. This activity is monitored and may be flagged as a violation of
              test rules.
              {tabSwitchAttempts > 1 && (
                <p className="mt-2 font-semibold text-red-600">
                  This is your {tabSwitchAttempts}
                  {tabSwitchAttempts === 2 ? "nd" : tabSwitchAttempts === 3 ? "rd" : "th"} violation. Multiple
                  violations may result in automatic test submission or disqualification.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => {
                setShowTabWarning(false)
                setObscureContent(false) // Restore the test content
                // Re-enter fullscreen if needed
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

      {/* Face Not Detected Warning Dialog */}
      <AlertDialog open={showFaceWarning} onOpenChange={setShowFaceWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Face Not Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Your face is not visible in the camera frame. Please ensure your face is clearly visible throughout the
              test.
              {proctorViolations.noFace > 0 && (
                <p className="mt-2 font-semibold text-red-600">
                  This is your {proctorViolations.noFace + 1}
                  {proctorViolations.noFace === 0
                    ? "st"
                    : proctorViolations.noFace === 1
                      ? "nd"
                      : proctorViolations.noFace === 2
                        ? "rd"
                        : "th"}{" "}
                  violation. Multiple violations may result in automatic test submission.
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

      {/* Multiple Faces Warning Dialog */}
      <AlertDialog open={showMultipleFacesWarning} onOpenChange={setShowMultipleFacesWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Multiple Faces Detected</AlertDialogTitle>
            <AlertDialogDescription>
              Multiple faces have been detected in the camera frame. Only the test taker should be visible during the
              test. This is a serious violation of test integrity and may result in immediate test submission.
              {proctorViolations.multipleFaces > 0 && (
                <p className="mt-2 font-semibold text-red-600">
                  This is your {proctorViolations.multipleFaces + 1}
                  {proctorViolations.multipleFaces === 0 ? "st" : "nd"} violation. Another violation will result in
                  automatic test submission.
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

      {/* Client-side Error Dialog */}
      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Technical Issue Detected
            </AlertDialogTitle>
            <AlertDialogDescription>
              A technical issue has been detected in the test environment. The test has been paused to protect your
              progress.
              <div className="mt-2 p-3 bg-gray-100 rounded-md text-sm font-mono overflow-x-auto">
                {errorMessage || "Unknown error"}
              </div>
              {clientErrors > 0 && (
                <p className="mt-2 font-medium text-amber-600">
                  This is the {clientErrors + 1}
                  {clientErrors === 0 ? "st" : clientErrors === 1 ? "nd" : clientErrors === 2 ? "rd" : "th"} technical
                  issue detected.
                </p>
              )}
              <p className="mt-2">
                Click "Continue Test" to resume. If you continue to experience issues, please contact support.
              </p>
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
