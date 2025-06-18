"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"

export default function TakeTest() {
  const router = useRouter()
  const params = useParams()
  const testId = params.id as string

  const [test, setTest] = useState<any>(null)
  const [questions, setQuestions] = useState<any[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchTest = async () => {
      try {
        const response = await fetch(`/api/user/test/${testId}`)
        if (!response.ok) {
          setError("Failed to load test")
          return
        }
        const data = await response.json()
        setTest(data.test)
        setQuestions(data.questions || [])
      } catch (err) {
        setError("Failed to load test")
      } finally {
        setLoading(false)
      }
    }

    if (testId) {
      fetchTest()
    }
  }, [testId])

  const handleSubmit = async () => {
    try {
      const response = await fetch(`/api/user/test/${testId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers, violations: {}, timeSpent: 0 }),
      })

      if (response.ok) {
        const result = await response.json()
        router.push(`/user/test-results/${result.resultId}`)
      }
    } catch (err) {
      setError("Failed to submit test")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>Loading test...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">{error}</div>
      </div>
    )
  }

  if (!test || questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          No test data found
        </div>
      </div>
    )
  }

  const currentQuestion = questions[currentIndex]

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">{test.title}</h1>
          <p className="text-gray-600 mb-4">{test.topic}</p>
          <div className="text-sm text-gray-500">
            Question {currentIndex + 1} of {questions.length}
          </div>
        </div>

        {currentQuestion && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4">{currentQuestion.text}</h2>

            {currentQuestion.code_snippet && (
              <div className="bg-gray-900 text-green-400 p-4 rounded mb-4 font-mono text-sm">
                <pre>{currentQuestion.code_snippet}</pre>
              </div>
            )}

            <div className="space-y-3">
              {currentQuestion.options?.map((option: string, index: number) => (
                <label
                  key={index}
                  className={`flex items-center p-3 border rounded cursor-pointer ${
                    answers[currentQuestion.id] === index
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-blue-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${currentQuestion.id}`}
                    value={index}
                    checked={answers[currentQuestion.id] === index}
                    onChange={() => setAnswers((prev) => ({ ...prev, [currentQuestion.id]: index }))}
                    className="mr-3"
                  />
                  <span className="font-medium mr-2">{String.fromCharCode(65 + index)}.</span>
                  <span>{option}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-50"
          >
            Previous
          </button>

          <div className="flex gap-2">
            {questions.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-8 h-8 rounded text-sm ${
                  index === currentIndex
                    ? "bg-blue-600 text-white"
                    : answers[questions[index]?.id] !== undefined
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-600"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {currentIndex === questions.length - 1 ? (
            <button onClick={handleSubmit} className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Submit Test
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex(Math.min(questions.length - 1, currentIndex + 1))}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
