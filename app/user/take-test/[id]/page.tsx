"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Clock, Shield, Code, Brain, Wrench } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Watermark component
const WatermarkOverlay = ({ userEmail }: { userEmail: string }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-gray-400 text-sm font-mono transform -rotate-45 select-none"
            style={{
              left: `${(i % 5) * 20}%`,
              top: `${Math.floor(i / 5) * 25}%`,
              transform: `rotate(-45deg) translate(${Math.random() * 50}px, ${Math.random() * 50}px)`,
            }}
          >
            {userEmail}
          </div>
        ))}
      </div>
    </div>
  )
}

// Question type icon component
const QuestionTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "theoretical":
      return <Brain className="h-4 w-4 text-blue-500" />
    case "code_snippet":
      return <Code className="h-4 w-4 text-green-500" />
    case "practical":
      return <Wrench className="h-4 w-4 text-orange-500" />
    default:
      return <Brain className="h-4 w-4 text-gray-500" />
  }
}

export default function TakeTest() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const testId = params.id as string

  // Test state
  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [showSubmitDialog, setShowSubmitDialog] = useState(false)
  const [showGuidelinesDialog, setShowGuidelinesDialog] = useState(false)

  // Security state
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [violations, setViolations] = useState({
    tabSwitches: 0,
    rightClicks: 0,
    devTools: 0,
    copyPaste: 0,
    screenshots: 0,
  })
  const [isBlurred, setIsBlurred] = useState(false)
  const [showViolationWarning, setShowViolationWarning] = useState(false)

  // Refs
  const timerRef = useRef<NodeJS.Timeout>()
  const violationTimeoutRef = useRef<NodeJS.Timeout>()

  // Memoized functions
  const handleSubmitTest = useCallback(async () => {
    if (submitting) return

    setSubmitting(true)

    try {
      const response = await fetch(`/api/user/test/${testId}/submit`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          answers,
          violations,
          timeSpent: (test?.duration || 60) * 60 - timeRemaining,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to submit test")
      }

      const result = await response.json()

      // Exit fullscreen before redirecting
      try {
        if (document.fullscreenElement) {
          await document.exitFullscreen()
        }
      } catch (err) {
        console.error("Failed to exit fullscreen:", err)
      }

      toast({
        title: "Test Submitted Successfully",
        description: `Your score: ${result.score}/${result.totalQuestions}`,
      })

      router.push(`/user/test-results/${result.resultId}`)
    } catch (err) {
      console.error("Error submitting test:", err)
      setError("Failed to submit test. Please try again.")
      setSubmitting(false)
    }
  }, [submitting, testId, answers, violations, test?.duration, timeRemaining, toast, router])

  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } catch (err) {
      console.error("Failed to enter fullscreen:", err)
      setError("Please enable fullscreen mode to continue with the test")
    }
  }, [])

  const handleViolation = useCallback(
    (type: keyof typeof violations) => {
      setViolations((prev) => ({
        ...prev,
        [type]: prev[type] + 1,
      }))

      // Show blur effect and warning
      setIsBlurred(true)
      setShowViolationWarning(true)

      // Clear previous timeout
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current)
      }

      // Remove blur after 3 seconds
      violationTimeoutRef.current = setTimeout(() => {
        setIsBlurred(false)
        setShowViolationWarning(false)
      }, 3000)

      toast({
        title: "Security Violation Detected",
        description: `${type} detected. This has been logged.`,
        variant: "destructive",
      })
    },
    [toast],
  )

  // Fetch test data
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true)
        setError("")

        console.log("Fetching test data for ID:", testId)

        const response = await fetch(`/api/user/test/${testId}`)

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}))
          console.error("API Error:", response.status, errorData)

          if (response.status === 401) {
            setError("Authentication failed. Please log in again.")
            setTimeout(() => router.push("/login"), 2000)
            return
          } else if (response.status === 403) {
            setError("You are not authorized to access this test. This test has not been assigned to you.")
            return
          } else if (response.status === 404) {
            setError("Test not found or not published.")
            return
          } else {
            setError(errorData.error || `Failed to fetch test: ${response.statusText}`)
            return
          }
        }

        const data = await response.json()
        console.log("Test data received:", data)

        if (data.error) {
          setError(data.error)
          return
        }

        if (!data.test) {
          setError("Test data not found")
          return
        }

        // Ensure test has required properties
        const testData = {
          ...data.test,
          duration: data.test.duration || 60, // Default to 60 minutes if not set
          questions: data.questions || [],
        }

        setTest(testData)
        setQuestions(data.questions || [])
        setTimeRemaining((testData.duration || 60) * 60) // Convert minutes to seconds
        setUserEmail(data.userEmail || "user@example.com")
        setShowGuidelinesDialog(true) // Show guidelines first

        console.log("Test loaded successfully:", testData.title)
      } catch (err) {
        console.error("Error fetching test:", err)
        setError("Failed to load test. Please check your internet connection and try again.")
      } finally {
        setLoading(false)
      }
    }

    if (testId) {
      fetchTest()
    }
  }, [testId, router])

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !loading && test && !showGuidelinesDialog) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && !loading && test && !showGuidelinesDialog) {
      handleSubmitTest()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeRemaining, loading, test, showGuidelinesDialog, handleSubmitTest])

  // Security event listeners
  useEffect(() => {
    if (!test) return // Only add listeners after test is loaded

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleViolation("tabSwitches")
      }
    }

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      handleViolation("rightClicks")
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent F12, Ctrl+Shift+I, Ctrl+U, etc.
      if (
        e.key === "F12" ||
        (e.ctrlKey && e.shiftKey && e.key === "I") ||
        (e.ctrlKey && e.shiftKey && e.key === "C") ||
        (e.ctrlKey && e.key === "u") ||
        (e.ctrlKey && e.key === "c") ||
        (e.ctrlKey && e.key === "v") ||
        (e.ctrlKey && e.key === "x")
      ) {
        e.preventDefault()
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
          handleViolation("devTools")
        } else if (e.ctrlKey && (e.key === "c" || e.key === "v" || e.key === "x")) {
          handleViolation("copyPaste")
        }
      }
    }

    const handlePrintScreen = (e: KeyboardEvent) => {
      if (e.key === "PrintScreen") {
        e.preventDefault()
        handleViolation("screenshots")
      }
    }

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
      if (!document.fullscreenElement && test) {
        handleViolation("tabSwitches")
      }
    }

    // Add event listeners
    document.addEventListener("visibilitychange", handleVisibilityChange)
    document.addEventListener("contextmenu", handleContextMenu)
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("keyup", handlePrintScreen)
    document.addEventListener("fullscreenchange", handleFullscreenChange)

    // Disable text selection
    document.body.style.userSelect = "none"
    document.body.style.webkitUserSelect = "none"

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
      document.removeEventListener("contextmenu", handleContextMenu)
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("keyup", handlePrintScreen)
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
      document.body.style.userSelect = ""
      document.body.style.webkitUserSelect = ""
    }
  }, [handleViolation, test])

  const handleAnswerSelect = (questionId: string, answerIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answerIndex,
    }))
  }

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1)
    }
  }

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1)
    }
  }

  const handleStartTest = () => {
    setShowGuidelinesDialog(false)
    enterFullscreen()
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0
  const answeredCount = Object.keys(answers).length

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No test data or questions found.</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 ${isBlurred ? "blur-sm" : ""}`}>
      <WatermarkOverlay userEmail={userEmail} />

      {/* Guidelines Dialog */}
      {showGuidelinesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Test Guidelines</h2>
            <div className="text-sm text-gray-600 mb-4">
              Please read the following guidelines before starting the test:
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Ensure you are in a quiet, well-lit environment.</li>
                <li>The test must be taken in fullscreen mode.</li>
                <li>Copying or using external resources is prohibited.</li>
                <li>Right-clicking and developer tools are disabled.</li>
                <li>The test duration is {test?.duration || 60} minutes.</li>
                <li>Your activities will be monitored for security violations.</li>
                <li>Click "Start Test" to begin in fullscreen mode.</li>
              </ul>
            </div>
            <div className="flex justify-end">
              <Button onClick={handleStartTest} className="bg-purple-600 hover:bg-purple-700">
                Start Test
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Confirmation Dialog */}
      {showSubmitDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Submit Test</h2>
            <div className="text-sm text-gray-600 mb-4">
              {answeredCount < questions.length ? (
                <>
                  You have answered {answeredCount} out of {questions.length} questions. Are you sure you want to submit
                  the test? Unanswered questions will be marked as incorrect.
                </>
              ) : (
                <>You have answered all {questions.length} questions. Are you sure you want to submit the test?</>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button onClick={() => setShowSubmitDialog(false)} variant="outline">
                Cancel
              </Button>
              <Button onClick={handleSubmitTest} className="bg-green-600 hover:bg-green-700" disabled={submitting}>
                {submitting ? "Submitting..." : "Submit Test"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {showViolationWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Alert variant="destructive" className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertDescription>Security violation detected! This action has been logged.</AlertDescription>
          </Alert>
        </div>
      )}

      {!isFullscreen && !showGuidelinesDialog && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-75">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Fullscreen Required</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="mb-4">Please enable fullscreen mode to continue with the test.</p>
              <Button onClick={enterFullscreen} className="bg-purple-600 hover:bg-purple-700">
                Enter Fullscreen
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {!showGuidelinesDialog && (
        <div className="container mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-purple-800">{test?.title}</h1>
              <p className="text-gray-600">{test?.topic}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-red-600">
                <Clock className="h-5 w-5" />
                <span className="font-mono text-lg">{formatTime(timeRemaining)}</span>
              </div>
              <div className="text-sm text-gray-500">
                Violations: {Object.values(violations).reduce((a, b) => a + b, 0)}
              </div>
            </div>
          </div>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <span className="text-sm text-gray-600">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Question */}
          {currentQuestion && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <QuestionTypeIcon type={currentQuestion.type} />
                  <span className="text-sm font-medium capitalize text-gray-600">
                    {currentQuestion.type?.replace("_", " ")} Question
                  </span>
                  <span className="text-xs px-2 py-1 bg-gray-100 rounded-full">{currentQuestion.difficulty}</span>
                </div>
                <CardTitle className="text-lg">{currentQuestion.text}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Code snippet display */}
                {currentQuestion.code_snippet && (
                  <div className="mb-4 p-4 bg-gray-900 text-green-400 rounded-lg font-mono text-sm overflow-x-auto">
                    <div className="flex items-center gap-2 mb-2">
                      <Code className="h-4 w-4" />
                      <span className="text-xs uppercase">{currentQuestion.programming_language || "Code"}</span>
                    </div>
                    <pre className="whitespace-pre-wrap">{currentQuestion.code_snippet}</pre>
                  </div>
                )}

                {/* Options */}
                <div className="space-y-3">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <label
                      key={index}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                        answers[currentQuestion.id] === index
                          ? "border-purple-500 bg-purple-50"
                          : "border-gray-200 hover:border-purple-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question-${currentQuestion.id}`}
                        value={index}
                        checked={answers[currentQuestion.id] === index}
                        onChange={() => handleAnswerSelect(currentQuestion.id, index)}
                        className="mr-3 text-purple-600"
                      />
                      <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                      <span>{option}</span>
                    </label>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={handlePreviousQuestion} disabled={currentQuestionIndex === 0}>
              Previous
            </Button>

            <div className="flex gap-2">
              {questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentQuestionIndex(index)}
                  className={`w-8 h-8 rounded-full text-sm font-medium ${
                    index === currentQuestionIndex
                      ? "bg-purple-600 text-white"
                      : answers[questions[index]?.id] !== undefined
                        ? "bg-green-100 text-green-800 border border-green-300"
                        : "bg-gray-100 text-gray-600 border border-gray-300"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            {currentQuestionIndex === questions.length - 1 ? (
              <Button
                onClick={() => setShowSubmitDialog(true)}
                disabled={submitting}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitting ? "Submitting..." : "Submit Test"}
              </Button>
            ) : (
              <Button onClick={handleNextQuestion}>Next</Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
