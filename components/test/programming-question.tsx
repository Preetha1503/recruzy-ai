"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Code, AlertTriangle, Terminal } from "lucide-react"
import type { Question } from "@/lib/types"

interface ProgrammingQuestionProps {
  question: Question
  currentAnswer: number | null
  onAnswerSelect: (optionIndex: number) => void
  questionNumber: number
  isDisabled?: boolean
}

const getQuestionIcon = (type: Question["type"]) => {
  switch (type) {
    case "code_snippet":
      return <Code className="h-5 w-5 text-blue-600" />
    case "output_prediction":
      return <Terminal className="h-5 w-5 text-green-600" />
    case "error_identification":
      return <AlertTriangle className="h-5 w-5 text-red-600" />
    default:
      return null
  }
}

const getQuestionTypeLabel = (type: Question["type"]) => {
  switch (type) {
    case "code_snippet":
      return "Code Analysis"
    case "output_prediction":
      return "Output Prediction"
    case "error_identification":
      return "Error Identification"
    case "multiple_choice":
      return "Multiple Choice"
    default:
      return "Question"
  }
}

export function ProgrammingQuestion({
  question,
  currentAnswer,
  onAnswerSelect,
  questionNumber,
  isDisabled = false,
}: ProgrammingQuestionProps) {
  return (
    <Card className="border-gray-200 max-h-[70vh] overflow-y-auto">
      <CardHeader>
        <CardTitle className="text-lg text-gray-800 flex items-center gap-2">
          {getQuestionIcon(question.type)}
          <span>Question {questionNumber}</span>
          <span className="text-sm font-normal text-gray-600 bg-gray-100 px-2 py-1 rounded">
            {getQuestionTypeLabel(question.type)}
          </span>
          {question.programming_language && (
            <span className="text-sm font-normal text-blue-600 bg-blue-100 px-2 py-1 rounded capitalize">
              {question.programming_language}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Question Text */}
          <div className="text-gray-700 leading-relaxed">{question.text}</div>

          {/* Code Snippet Display */}
          {question.code_snippet && (
            <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
              <div className="flex items-center gap-2 mb-2 text-sm text-gray-400">
                <Code className="h-4 w-4" />
                <span className="capitalize">{question.programming_language || "Code"}</span>
              </div>
              <pre className="text-sm leading-relaxed font-mono whitespace-pre-wrap">
                <code>{question.code_snippet}</code>
              </pre>
            </div>
          )}

          {/* Expected Output (for debugging questions) */}
          {question.expected_output && question.type === "output_prediction" && (
            <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-sm text-green-700 font-medium">
                <Terminal className="h-4 w-4" />
                <span>Expected Output Format</span>
              </div>
              <div className="text-sm text-green-800 font-mono">{question.expected_output}</div>
            </div>
          )}

          {/* Error Line Hint (for error identification) */}
          {question.error_line && question.type === "error_identification" && (
            <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 mb-2 text-sm text-red-700 font-medium">
                <AlertTriangle className="h-4 w-4" />
                <span>Focus on line {question.error_line}</span>
              </div>
            </div>
          )}

          {/* Answer Options */}
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <div
                key={index}
                className={`flex items-start rounded-md border p-3 cursor-pointer transition-all duration-200 ${
                  currentAnswer === index
                    ? "border-blue-500 bg-blue-50 shadow-sm"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                } ${isDisabled ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => !isDisabled && onAnswerSelect(index)}
              >
                <div
                  className={`mr-3 flex h-5 w-5 items-center justify-center rounded-sm border mt-1 ${
                    currentAnswer === index ? "border-blue-500 bg-blue-500" : "border-gray-300"
                  }`}
                >
                  {currentAnswer === index && <CheckCircle className="h-4 w-4 text-white" />}
                </div>
                <div className="flex-1">
                  {/* For code-related options, use monospace font */}
                  <span className={`${question.type !== "multiple_choice" ? "font-mono text-sm" : ""}`}>
                    {String.fromCharCode(65 + index)}. {option}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Difficulty and Language Info */}
          <div className="flex items-center gap-4 pt-2 border-t border-gray-100 text-sm text-gray-500">
            <span className="capitalize">Difficulty: {question.difficulty}</span>
            {question.programming_language && (
              <span className="capitalize">Language: {question.programming_language}</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
