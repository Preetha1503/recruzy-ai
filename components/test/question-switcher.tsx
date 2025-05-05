"use client"

import type React from "react"

import { useEffect, useState } from "react"

interface QuestionSwitcherProps {
  currentQuestion: number
  totalQuestions: number
  onQuestionChange: (index: number) => void
}

export const QuestionSwitcher: React.FC<QuestionSwitcherProps> = ({
  currentQuestion,
  totalQuestions,
  onQuestionChange,
}) => {
  const [questionNumbers, setQuestionNumbers] = useState<number[]>([])

  useEffect(() => {
    // Generate an array of question numbers
    const numbers = Array.from({ length: totalQuestions }, (_, i) => i + 1)
    setQuestionNumbers(numbers)
  }, [totalQuestions])

  return (
    <div className="space-y-2">
      <h3 className="text-sm font-medium text-gray-500">Jump to Question</h3>
      <div className="grid grid-cols-5 gap-2">
        {questionNumbers.map((number, index) => (
          <button
            key={index}
            onClick={() => onQuestionChange(index)}
            className={`rounded-md p-2 text-sm font-medium transition-colors ${
              index === currentQuestion
                ? "bg-purple-700 text-white"
                : "bg-gray-100 text-gray-700 hover:bg-purple-50 hover:text-purple-700"
            }`}
          >
            {number}
          </button>
        ))}
      </div>
    </div>
  )
}
