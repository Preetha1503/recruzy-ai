"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { AlertCircle, ArrowLeft, CheckCircle, XCircle, AlertTriangle, Eye, Users } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
import { Badge } from "@/components/ui/badge"

interface TestResult {
  id: string
  user_id: string
  test_id: string
  score: number
  answers: Record<string, number>
  time_taken: number | null
  started_at: string | null
  completed_at: string
  tab_switch_attempts: number
  no_face_violations: number
  multiple_faces_violations: number
  face_changed_violations?: number
  error_count?: number
  client_errors?: any[]
  test: {
    title: string
    topic: string
    description: string
    duration: number
  }
  questions: {
    id: string
    text: string
    options: string[]
    correct_answer: number
    explanation: string | null
  }[]
}

export default function TestResultPage({ params }: { params: { id: string } }) {
  const resultId = params.id
  const { toast } = useToast()
  const [result, setResult] = useState<TestResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExplanations, setShowExplanations] = useState(false)

  useEffect(() => {
    const fetchTestResult = async () => {
      try {
        setLoading(true)
        setError(null)

        console.log(`Fetching test result with ID: ${resultId}`)
        const response = await fetch(`/api/user/test-result?resultId=${resultId}`)

        // Check if response is ok before trying to parse JSON
        if (!response.ok) {
          const errorText = await response.text()
          console.error("API Error Response:", errorText)
          throw new Error(`Failed to fetch test result: ${response.status} ${response.statusText}`)
        }

        // Try to parse the JSON response
        let data
        try {
          data = await response.json()
        } catch (jsonError) {
          console.error("JSON Parse Error:", jsonError)
          throw new Error(
            `Failed to parse API response: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`,
          )
        }

        if (data.error) {
          throw new Error(data.error)
        }

        if (!data.result) {
          throw new Error("No result data returned from API")
        }

        console.log("Test result data received:", data.result)

        // Ensure all required fields exist
        const processedResult = {
          ...data.result,
          answers: data.result.answers || {},
          tab_switch_attempts: data.result.tab_switch_attempts || 0,
          no_face_violations: data.result.no_face_violations || 0,
          multiple_faces_violations: data.result.multiple_faces_violations || 0,
          face_changed_violations: data.result.face_changed_violations || 0,
          error_count: data.result.error_count || 0,
          client_errors: data.result.client_errors || [],
          questions: data.result.questions || [],
        }

        setResult(processedResult)
      } catch (err) {
        console.error("Error fetching test result:", err)
        const errorMessage = err instanceof Error ? err.message : "Failed to load test result"
        setError(errorMessage)
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    fetchTestResult()
  }, [resultId, toast])

  const formatTime = (seconds: number | null) => {
    if (seconds === null || seconds === undefined) return "N/A"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}m ${secs}s`
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

  if (error || !result) {
    return (
      <DashboardLayout requiredRole="user">
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || "Test result not found"}</AlertDescription>
        </Alert>
        <Button asChild className="mt-4">
          <Link href="/user/history">Back to History</Link>
        </Button>
      </DashboardLayout>
    )
  }

  // Safely calculate correct answers
  const correctAnswers = Object.keys(result.answers || {}).filter((questionId) => {
    const question = result.questions.find((q) => q.id === questionId)
    return question && result.answers[questionId] === question.correct_answer
  }).length

  const totalQuestions = result.questions?.length || 0
  const percentageScore = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0

  return (
    <DashboardLayout requiredRole="user">
      <div className="mb-6">
        <Button asChild variant="outline" size="sm" className="mb-4">
          <Link href="/user/history">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to History
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-800">{result.test?.title || "Test"} - Results</h1>
        <p className="text-gray-600">{result.test?.topic || "No topic"}</p>
      </div>

      {/* Score Card */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Your Score</span>
            <span className="text-2xl">{percentageScore}%</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={percentageScore} className="h-3 mb-2" />
          <div className="flex justify-between text-sm text-gray-600">
            <span>
              {correctAnswers} out of {totalQuestions} correct
            </span>
            <span>Time taken: {formatTime(result.time_taken)}</span>
          </div>

          {/* Proctoring Information */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <h3 className="font-medium mb-2">Test Integrity Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle
                  className={`h-5 w-5 ${(result.tab_switch_attempts || 0) > 0 ? "text-amber-500" : "text-green-500"}`}
                />
                <div>
                  <p className="text-sm font-medium">Tab Switches</p>
                  <p className="text-sm text-gray-500">{result.tab_switch_attempts || 0} attempts</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Eye
                  className={`h-5 w-5 ${(result.no_face_violations || 0) > 0 ? "text-amber-500" : "text-green-500"}`}
                />
                <div>
                  <p className="text-sm font-medium">Face Not Detected</p>
                  <p className="text-sm text-gray-500">{result.no_face_violations || 0} violations</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Users
                  className={`h-5 w-5 ${(result.multiple_faces_violations || 0) > 0 ? "text-red-500" : "text-green-500"}`}
                />
                <div>
                  <p className="text-sm font-medium">Multiple Faces</p>
                  <p className="text-sm text-gray-500">{result.multiple_faces_violations || 0} violations</p>
                </div>
              </div>
            </div>

            {/* Client Errors Section */}
            {(result.error_count || 0) > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium text-amber-700">Client Errors: {result.error_count}</h4>
                {result.client_errors && result.client_errors.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600 max-h-32 overflow-y-auto">
                    <ul className="list-disc pl-5">
                      {result.client_errors.slice(0, 3).map((error, index) => (
                        <li key={index}>{typeof error === "string" ? error : JSON.stringify(error)}</li>
                      ))}
                      {result.client_errors.length > 3 && <li>...and {result.client_errors.length - 3} more errors</li>}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {((result.tab_switch_attempts || 0) > 0 ||
              (result.no_face_violations || 0) > 0 ||
              (result.multiple_faces_violations || 0) > 0) && (
              <Alert variant="warning" className="mt-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  {(result.multiple_faces_violations || 0) > 0
                    ? "Multiple faces were detected during your test, which may be considered a violation of test integrity."
                    : (result.no_face_violations || 0) > 0
                      ? "Your face was not detected in the camera frame at times during the test."
                      : "You switched tabs during the test, which may be considered a violation of test integrity."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Questions and Answers */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Questions and Answers</h2>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowExplanations(!showExplanations)}
            className="text-purple-700 border-purple-200"
          >
            {showExplanations ? "Hide Explanations" : "Show Explanations"}
          </Button>
        </div>

        {result.questions && result.questions.length > 0 ? (
          <div className="space-y-6">
            {result.questions.map((question, index) => {
              const userAnswer = result.answers?.[question.id]
              const isCorrect = userAnswer === question.correct_answer
              return (
                <Card key={question.id} className={isCorrect ? "border-green-200" : "border-red-200"}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-start justify-between">
                      <span>
                        Question {index + 1}: {question.text}
                      </span>
                      {isCorrect ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Correct</Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Incorrect</Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {question.options &&
                        question.options.map((option, optionIndex) => (
                          <div
                            key={optionIndex}
                            className={`flex items-center rounded-md border p-3 ${
                              optionIndex === question.correct_answer
                                ? "border-green-500 bg-green-50"
                                : optionIndex === userAnswer && optionIndex !== question.correct_answer
                                  ? "border-red-500 bg-red-50"
                                  : "border-gray-200"
                            }`}
                          >
                            <div
                              className={`mr-3 flex h-5 w-5 items-center justify-center rounded-sm ${
                                optionIndex === question.correct_answer
                                  ? "bg-green-500"
                                  : optionIndex === userAnswer && optionIndex !== question.correct_answer
                                    ? "bg-red-500"
                                    : "border border-gray-300"
                              }`}
                            >
                              {optionIndex === question.correct_answer ? (
                                <CheckCircle className="h-4 w-4 text-white" />
                              ) : optionIndex === userAnswer && optionIndex !== question.correct_answer ? (
                                <XCircle className="h-4 w-4 text-white" />
                              ) : null}
                            </div>
                            <span>{option}</span>
                          </div>
                        ))}

                      {showExplanations && question.explanation && (
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-sm font-medium text-blue-800">Explanation:</p>
                          <p className="text-sm text-blue-700">{question.explanation}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No questions found for this test.</AlertDescription>
          </Alert>
        )}
      </div>
    </DashboardLayout>
  )
}
