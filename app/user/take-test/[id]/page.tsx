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

  // Security functions
  const enterFullscreen = useCallback(async () => {
    try {
      await document.documentElement.requestFullscreen()
      setIsFullscreen(true)
    } catch (err) {
      console.error("Failed to enter fullscreen:", err)
      setError("Please enable fullscreen mode to continue with the test")
    }
  }, [])

  const exitFullscreen = useCallback(async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      }
      setIsFullscreen(false)
    } catch (err) {
      console.error("Failed to exit fullscreen:", err)
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

  // Security event listeners
  useEffect(() => {
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

  // Fetch test data
  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await fetch(`/api/user/test/${testId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch test")
        }

        const data = await response.json()
        setTest(data.test)
        setQuestions(data.questions)
        setTimeRemaining(data.test.duration * 60) // Convert minutes to seconds
        setUserEmail(data.userEmail || "user@example.com")
        setLoading(false)

        // Enter fullscreen after loading
        setTimeout(() => {
          enterFullscreen()
        }, 1000)
      } catch (err) {
        console.error("Error fetching test:", err)
        setError("Failed to load test")
        setLoading(false)
      }
    }

    if (testId) {
      fetchTest()
    }
  }, [testId, enterFullscreen])

  // Timer effect
  useEffect(() => {
    if (timeRemaining > 0 && !loading) {
      timerRef.current = setTimeout(() => {
        setTimeRemaining((prev) => prev - 1)
      }, 1000)
    } else if (timeRemaining === 0 && !loading) {
      handleSubmitTest()
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [timeRemaining, loading])

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

  const handleSubmitTest = async () => {
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
          timeSpent: test.duration * 60 - timeRemaining,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to submit test")
      }

      const result = await response.json()

      // Exit fullscreen before redirecting
      await exitFullscreen()

      toast({
        title: "Test Submitted Successfully",
        description: `Your score: ${result.score}/${questions.length}`,
      })

      router.push(`/user/test-results/${result.resultId}`)
    } catch (err) {
      console.error("Error submitting test:", err)
      setError("Failed to submit test")
      setSubmitting(false)
    }
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`
  }

  const currentQuestion = questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100

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

  return (
    <div className={`min-h-screen bg-gray-50 ${isBlurred ? "blur-sm" : ""}`}>
      <WatermarkOverlay userEmail={userEmail} />

      {showViolationWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Alert variant="destructive" className="max-w-md">
            <Shield className="h-4 w-4" />
            <AlertDescription>Security violation detected! This action has been logged.</AlertDescription>
          </Alert>
        </div>
      )}

      {!isFullscreen && (
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
            <Button onClick={handleSubmitTest} disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? "Submitting..." : "Submit Test"}
            </Button>
          ) : (
            <Button onClick={handleNextQuestion}>Next</Button>
          )}
        </div>
      </div>
    </div>
  )
}
