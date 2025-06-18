import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getTestResultById } from "@/lib/db/secure-result-operations"
import { getTestWithQuestions } from "@/lib/db/secure-test-operations"
import { PDFDocument, rgb, StandardFonts } from "pdf-lib"
import { analyzeUserPerformance, generateRecommendations } from "@/lib/analytics-service"
import type { TestResult, TestWithQuestions } from "@/lib/types"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const resultId = searchParams.get("resultId")
    const userId = cookies().get("user_id")?.value

    console.log("PDF Download API called with:", { resultId, userId })

    if (!resultId) {
      console.error("Missing resultId parameter")
      return NextResponse.json({ error: "Result ID is required" }, { status: 400 })
    }

    if (!userId) {
      console.error("User ID not found in cookies")
      return NextResponse.json({ error: "User ID not found" }, { status: 401 })
    }

    // Get the test result
    let result: TestResult | null = null
    try {
      result = await getTestResultById(resultId)
      console.log("getTestResultById result:", result ? "Found" : "Not found")
    } catch (error) {
      console.error("Error in getTestResultById:", error)
      return NextResponse.json({ error: "Failed to fetch test result" }, { status: 500 })
    }

    if (!result) {
      return NextResponse.json({ error: "Test result not found" }, { status: 404 })
    }

    // Check if the result belongs to the user
    if (result.user_id !== userId) {
      const role = cookies().get("role")?.value
      if (role !== "admin") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
      }
    }

    // Get the test with questions
    let test: TestWithQuestions | null = null
    try {
      test = await getTestWithQuestions(result.test_id)
      console.log("getTestWithQuestions result:", test ? "Found" : "Not found")
    } catch (error) {
      console.error("Error in getTestWithQuestions:", error)
      return NextResponse.json({ error: "Failed to fetch test with questions" }, { status: 500 })
    }

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    // Ensure test.questions exists
    if (!test.questions || !Array.isArray(test.questions)) {
      console.error("Test questions are missing or not an array")
      return NextResponse.json({ error: "Test questions are missing" }, { status: 500 })
    }

    // Ensure result.answers exists
    if (!result.answers || typeof result.answers !== "object") {
      console.error("Test answers are missing or invalid")
      return NextResponse.json({ error: "Test answers are missing" }, { status: 500 })
    }

    // Create a PDF document
    const pdfDoc = await PDFDocument.create()
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman)
    const timesRomanBoldFont = await pdfDoc.embedFont(StandardFonts.TimesRomanBold)
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica)
    const helveticaBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    // Add a page
    let page = pdfDoc.addPage()
    const { width, height } = page.getSize()
    const fontSize = 12
    const margin = 50
    const lineHeight = 16
    const maxWidth = width - 2 * margin

    // Function to add text with wrapping
    const addWrappedText = (text, x, y, options) => {
      const { font, size, color, maxWidth } = options

      // Split text into words
      const words = text.split(" ")
      let line = ""
      let currentY = y

      for (const word of words) {
        const testLine = line ? `${line} ${word}` : word
        const testWidth = font.widthOfTextAtSize(testLine, size)

        if (testWidth > maxWidth) {
          // Draw the current line and start a new one
          try {
            page.drawText(line, { x, y: currentY, font, size, color })
          } catch (e) {
            console.error("Error drawing text:", line, e)
          }
          line = word
          currentY -= lineHeight

          // Check if we need a new page
          if (currentY < margin) {
            page = pdfDoc.addPage()
            currentY = height - margin
          }
        } else {
          line = testLine
        }
      }

      // Draw the last line
      if (line) {
        try {
          page.drawText(line, { x, y: currentY, font, size, color })
        } catch (e) {
          console.error("Error drawing text:", line, e)
        }
        currentY -= lineHeight
      }

      return currentY
    }

    // Add header with logo and title - using drawRectangle instead of setFillColor
    try {
      // Draw header background
      page.drawRectangle({
        x: 0,
        y: height - 30,
        width: width,
        height: 30,
        color: rgb(0.96, 0.96, 0.98),
      })
    } catch (e) {
      console.error("Error drawing header rectangle:", e)
    }

    // Add title
    try {
      page.drawText("SAMAJH AI-Powered Interview Platform", {
        x: margin,
        y: height - 20,
        font: helveticaBoldFont,
        size: 20,
        color: rgb(0.4, 0.2, 0.76), // Purple color
      })
    } catch (e) {
      console.error("Error drawing text:", "SAMAJH AI-Powered Interview Platform", e)
    }

    // Add report title
    try {
      page.drawText(`Performance Analysis: ${test.title}`, {
        x: margin,
        y: height - 50,
        font: helveticaBoldFont,
        size: 16,
        color: rgb(0, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", `Performance Analysis: ${test.title}`, e)
    }

    // Add score
    try {
      page.drawText(`Score: ${result.score}%`, {
        x: margin,
        y: height - 75,
        size: 14,
        font: helveticaBoldFont,
        color: result.score >= 70 ? rgb(0, 0.5, 0) : result.score >= 50 ? rgb(0.8, 0.5, 0) : rgb(0.8, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", `Score: ${result.score}%`, e)
    }

    // Add completion date and time taken
    try {
      page.drawText(`Completed on: ${new Date(result.completed_at).toLocaleDateString()}`, {
        x: margin,
        y: height - 95,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", `Completed on: ${new Date(result.completed_at).toLocaleDateString()}`, e)
    }

    const minutes = Math.floor((result.time_taken || 0) / 60)
    const seconds = (result.time_taken || 0) % 60
    try {
      page.drawText(`Time taken: ${minutes}:${seconds.toString().padStart(2, "0")}`, {
        x: margin,
        y: height - 110,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", `Time taken: ${minutes}:${seconds.toString().padStart(2, "0")}`, e)
    }

    // Calculate performance metrics
    const performanceByDifficulty = calculatePerformanceByDifficulty(test, result)
    const topicPerformance = calculateTopicPerformance(result, test)

    // Generate analytics using AI
    let strengths = []
    let weaknesses = []
    let recommendations = []
    let skillGaps = []

    try {
      // Calculate topic performance for AI analysis
      const analysisData = {
        test: {
          title: test.title,
          topic: test.topic,
          difficulty: test.difficulty || "intermediate",
          questions: test.questions.map((q) => ({
            id: q.id,
            text: q.text,
            topic: q.topic || test.topic,
            difficulty: q.difficulty || "intermediate",
            userAnswer: result.answers[q.id],
            correctAnswer: q.correct_answer,
            isCorrect: result.answers[q.id] === q.correct_answer,
          })),
        },
        result: {
          score: result.score,
          timeTaken: result.time_taken,
          completedAt: result.completed_at,
        },
        topicPerformance: Object.entries(topicPerformance).map(([topic, data]) => ({
          topic,
          correct: data.correct,
          total: data.total,
          percentage: data.percentage,
        })),
      }

      // Get detailed analysis from AI
      const analysisText = await analyzeUserPerformance(analysisData)

      // Parse the analysis to extract strengths and weaknesses with details
      const strengthsRegex = /Strengths:([\s\S]*?)(?=Weaknesses:|$)/i
      const weaknessesRegex = /Weaknesses:([\s\S]*?)(?=$)/i

      const strengthsMatch = analysisText.match(strengthsRegex)
      const weaknessesMatch = analysisText.match(weaknessesRegex)

      strengths = strengthsMatch
        ? strengthsMatch[1]
            .split("\n")
            .filter((s) => s.trim())
            .map((s) => {
              const parts = s.replace(/^[-*•\s]+/, "").split(":")
              return {
                topic: parts[0]?.trim() || "",
                details: parts[1]?.trim() || parts[0]?.trim() || "",
              }
            })
        : []

      weaknesses = weaknessesMatch
        ? weaknessesMatch[1]
            .split("\n")
            .filter((s) => s.trim())
            .map((s) => {
              const parts = s.replace(/^[-*•\s]+/, "").split(":")
              return {
                topic: parts[0]?.trim() || "",
                details: parts[1]?.trim() || parts[0]?.trim() || "",
              }
            })
        : []

      // If we couldn't extract strengths or weaknesses from the AI response,
      // generate some based on the topic performance
      if (strengths.length === 0) {
        strengths = Object.entries(topicPerformance)
          .filter(([_, data]) => data.percentage >= 70)
          .sort((a, b) => b[1].percentage - a[1].percentage)
          .slice(0, 3)
          .map(([topic, data]) => ({
            topic,
            details: `Strong understanding of ${topic} concepts (${data.percentage}% correct)`,
          }))
      }

      if (weaknesses.length === 0) {
        weaknesses = Object.entries(topicPerformance)
          .filter(([_, data]) => data.percentage < 70)
          .sort((a, b) => a[1].percentage - b[1].percentage)
          .slice(0, 3)
          .map(([topic, data]) => ({
            topic,
            details: `Needs improvement in ${topic} fundamentals (${data.percentage}% correct)`,
          }))
      }

      // Calculate skill gaps based on question performance
      skillGaps = calculateSkillGaps(result, test)

      // Generate recommendations using AI
      recommendations = await generateRecommendations([
        ...Object.entries(topicPerformance).map(([topic, data]) => ({
          topic,
          score: data.percentage,
          tests: 1,
        })),
        ...skillGaps.map((gap) => ({
          topic: gap.skill,
          score: 100 - gap.score,
          tests: 1,
        })),
      ])
    } catch (error) {
      console.error("Error generating analytics:", error)
      // Fallback to basic analytics if AI fails
      strengths = getTopStrengths(topicPerformance).map((item) => ({
        topic: item.topic,
        details: `Strong performance (${item.score}% correct)`,
      }))

      weaknesses = getTopWeaknesses(topicPerformance).map((item) => ({
        topic: item.topic,
        details: `Needs improvement (${item.score}% correct)`,
      }))

      recommendations = [
        "Focus on improving your understanding of topics with lower scores",
        "Review explanations for questions you answered incorrectly",
        "Take more tests to improve your performance",
        "Consider studying additional resources for challenging topics",
        "Practice regularly to maintain your skills",
      ]

      skillGaps = []
    }

    // Add performance summary section
    let yPosition = 700
    try {
      page.drawText("Performance Summary", {
        x: margin,
        y: yPosition,
        size: 16,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.8),
      })
    } catch (e) {
      console.error("Error drawing text:", "Performance Summary", e)
    }
    yPosition -= lineHeight * 1.5

    // Add performance metrics without pie chart
    const metricsX = margin + 30
    let metricsY = yPosition - 15

    try {
      page.drawText("Questions:", {
        x: metricsX,
        y: metricsY,
        size: 10,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", "Questions:", e)
    }
    try {
      page.drawText(`${test.questions.length} total`, {
        x: metricsX + 60,
        y: metricsY,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", `${test.questions.length} total`, e)
    }
    metricsY -= lineHeight

    try {
      page.drawText("Correct:", {
        x: metricsX,
        y: metricsY,
        size: 10,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", "Correct:", e)
    }

    const correctCount = Object.values(result.answers).filter((answer, index) => {
      const question = test.questions[index]
      return question && answer === question.correct_answer
    }).length

    try {
      page.drawText(`${correctCount} (${Math.round((correctCount / test.questions.length) * 100)}%)`, {
        x: metricsX + 60,
        y: metricsY,
        size: 10,
        font: helveticaFont,
        color: rgb(0, 0.5, 0),
      })
    } catch (e) {
      console.error(
        "Error drawing text:",
        `${correctCount} (${Math.round((correctCount / test.questions.length) * 100)}%)`,
        e,
      )
    }
    metricsY -= lineHeight

    try {
      page.drawText("Incorrect:", {
        x: metricsX,
        y: metricsY,
        size: 10,
        font: helveticaBoldFont,
        color: rgb(0, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", "Incorrect:", e)
    }

    const incorrectCount = test.questions.length - correctCount

    try {
      page.drawText(`${incorrectCount} (${Math.round((incorrectCount / test.questions.length) * 100)}%)`, {
        x: metricsX + 60,
        y: metricsY,
        size: 10,
        font: helveticaFont,
        color: rgb(0.8, 0, 0),
      })
    } catch (e) {
      console.error(
        "Error drawing text:",
        `${incorrectCount} (${Math.round((incorrectCount / test.questions.length) * 100)}%)`,
        e,
      )
    }

    yPosition -= 60 // Adjust yPosition to account for removed circle space

    // Add difficulty breakdown
    try {
      page.drawText("Performance by Difficulty", {
        x: margin,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.8),
      })
    } catch (e) {
      console.error("Error drawing text:", "Performance by Difficulty", e)
    }
    yPosition -= lineHeight * 1.5

    // Draw difficulty bars
    const barWidth = 300
    const barHeight = 20
    const barGap = 10

    // Ensure performanceByDifficulty is an object before iterating
    if (performanceByDifficulty && typeof performanceByDifficulty === "object") {
      Object.entries(performanceByDifficulty).forEach(([difficulty, data]) => {
        if (!data || data.total === 0) return

        const percentage = Math.round((data.correct / data.total) * 100)

        // Draw difficulty label
        try {
          page.drawText(`${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}:`, {
            x: margin,
            y: yPosition,
            size: 12,
            font: helveticaBoldFont,
            color: rgb(0, 0, 0),
          })
        } catch (e) {
          console.error("Error drawing text:", `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}:`, e)
        }

        // Draw background bar
        try {
          page.drawRectangle({
            x: margin + 100,
            y: yPosition - 10,
            width: barWidth,
            height: barHeight,
            color: rgb(0.9, 0.9, 0.9),
          })
        } catch (e) {
          console.error("Error drawing rectangle:", e)
        }

        // Draw filled portion
        try {
          page.drawRectangle({
            x: margin + 100,
            y: yPosition - 10,
            width: barWidth * (percentage / 100),
            height: barHeight,
            color: percentage >= 70 ? rgb(0, 0.7, 0) : percentage >= 50 ? rgb(0.9, 0.7, 0) : rgb(0.9, 0, 0),
          })
        } catch (e) {
          console.error("Error drawing rectangle:", e)
        }

        // Draw percentage text
        try {
          page.drawText(`${percentage}% (${data.correct}/${data.total})`, {
            x: margin + 110,
            y: yPosition - 5,
            size: 12,
            font: helveticaFont,
            color: rgb(1, 1, 1),
          })
        } catch (e) {
          console.error("Error drawing text:", `${percentage}% (${data.correct}/${data.total})`, e)
        }

        yPosition -= barHeight + barGap + 10
      })
    }

    yPosition -= lineHeight

    // Check if we need a new page
    if (yPosition < height / 3) {
      page = pdfDoc.addPage()
      yPosition = height - margin
    }

    // Add strengths and weaknesses section
    try {
      page.drawText("Strengths & Areas for Improvement", {
        x: margin,
        y: yPosition,
        size: 16,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.8),
      })
    } catch (e) {
      console.error("Error drawing text:", "Strengths & Areas for Improvement", e)
    }
    yPosition -= lineHeight * 1.5

    // Add strengths
    try {
      page.drawText("Strengths:", {
        x: margin,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0, 0.5, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", "Strengths:", e)
    }
    yPosition -= lineHeight * 1.2

    if (strengths && strengths.length > 0) {
      strengths.forEach((strength, index) => {
        const strengthText = `${index + 1}. ${strength.topic}: ${strength.details}`
        yPosition = addWrappedText(strengthText, margin + 20, yPosition, {
          font: helveticaFont,
          size: 12,
          color: rgb(0, 0, 0),
          maxWidth: maxWidth - 20,
        })
        yPosition -= lineHeight * 0.8
      })
    } else {
      yPosition = addWrappedText("No clear strengths identified yet.", margin + 20, yPosition, {
        font: helveticaFont,
        size: 12,
        color: rgb(0, 0, 0),
        maxWidth: maxWidth - 20,
      })
      yPosition -= lineHeight
    }

    yPosition -= lineHeight

    // Add weaknesses
    try {
      page.drawText("Areas for Improvement:", {
        x: margin,
        y: yPosition,
        size: 14,
        font: helveticaBoldFont,
        color: rgb(0.8, 0, 0),
      })
    } catch (e) {
      console.error("Error drawing text:", "Areas for Improvement:", e)
    }
    yPosition -= lineHeight * 1.2

    if (weaknesses && weaknesses.length > 0) {
      weaknesses.forEach((weakness, index) => {
        const weaknessText = `${index + 1}. ${weakness.topic}: ${weakness.details}`
        yPosition = addWrappedText(weaknessText, margin + 20, yPosition, {
          font: helveticaFont,
          size: 12,
          color: rgb(0, 0, 0),
          maxWidth: maxWidth - 20,
        })
        yPosition -= lineHeight * 0.8
      })
    } else {
      yPosition = addWrappedText("No clear areas for improvement identified yet.", margin + 20, yPosition, {
        font: helveticaFont,
        size: 12,
        color: rgb(0, 0, 0),
        maxWidth: maxWidth - 20,
      })
      yPosition -= lineHeight
    }

    yPosition -= lineHeight * 2

    // Check if we need a new page for recommendations
    if (yPosition < height / 3) {
      page = pdfDoc.addPage()
      yPosition = height - margin
    }

    // Add recommendations section
    try {
      page.drawText("Recommendations", {
        x: margin,
        y: yPosition,
        size: 16,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.8),
      })
    } catch (e) {
      console.error("Error drawing text:", "Recommendations", e)
    }
    yPosition -= lineHeight * 1.5

    // Add recommendations
    if (recommendations && recommendations.length > 0) {
      recommendations.forEach((recommendation, index) => {
        const recText = `${index + 1}. ${recommendation}`
        yPosition = addWrappedText(recText, margin + 10, yPosition, {
          font: helveticaFont,
          size: 12,
          color: rgb(0, 0, 0),
          maxWidth: maxWidth - 10,
        })
        yPosition -= lineHeight
      })
    } else {
      yPosition = addWrappedText("No specific recommendations available.", margin + 10, yPosition, {
        font: helveticaFont,
        size: 12,
        color: rgb(0, 0, 0),
        maxWidth: maxWidth - 10,
      })
      yPosition -= lineHeight
    }

    yPosition -= lineHeight * 2

    // Check if we need a new page for questions
    if (yPosition < height / 3) {
      page = pdfDoc.addPage()
      yPosition = height - margin
    }

    // Add questions and answers section
    try {
      page.drawText("Questions and Answers", {
        x: margin,
        y: yPosition,
        size: 16,
        font: helveticaBoldFont,
        color: rgb(0.2, 0.2, 0.8),
      })
    } catch (e) {
      console.error("Error drawing text:", "Questions and Answers", e)
    }
    yPosition -= lineHeight * 1.5

    // Process each question
    for (let i = 0; i < test.questions.length; i++) {
      const question = test.questions[i]
      if (!question) continue

      const userAnswer = result.answers[question.id]
      const isCorrect = userAnswer === question.correct_answer

      // Check if we need a new page
      if (yPosition < margin + 100) {
        page = pdfDoc.addPage()
        yPosition = height - margin
      }

      // Question number and text
      const questionText = `${i + 1}. ${question.text}`
      yPosition = addWrappedText(questionText, margin, yPosition, {
        font: helveticaBoldFont,
        size: fontSize,
        color: rgb(0, 0, 0),
        maxWidth,
      })
      yPosition -= lineHeight

      // User's answer
      const userAnswerText = `Your answer: ${(question.options && question.options[userAnswer]) || "Not answered"}`
      yPosition = addWrappedText(userAnswerText, margin + 20, yPosition, {
        font: helveticaFont,
        size: fontSize,
        color: isCorrect ? rgb(0, 0.5, 0) : rgb(0.8, 0, 0),
        maxWidth: maxWidth - 20,
      })
      yPosition -= lineHeight

      // Correct answer
      if (question.options && question.correct_answer !== undefined) {
        const correctAnswerText = `Correct answer: ${question.options[question.correct_answer]}`
        yPosition = addWrappedText(correctAnswerText, margin + 20, yPosition, {
          font: helveticaFont,
          size: fontSize,
          color: rgb(0, 0.5, 0),
          maxWidth: maxWidth - 20,
        })
        yPosition -= lineHeight
      }

      // Add explanation if available
      if (question.explanation) {
        const explanationText = `Explanation: ${question.explanation}`
        yPosition = addWrappedText(explanationText, margin + 20, yPosition, {
          font: helveticaFont,
          size: fontSize - 2,
          color: rgb(0, 0, 0),
          maxWidth: maxWidth - 20,
        })
      }

      // Add spacing between questions
      yPosition -= lineHeight * 1.5
    }

    // Add footer to each page
    const pageCount = pdfDoc.getPageCount()
    for (let i = 0; i < pageCount; i++) {
      const page = pdfDoc.getPage(i)
      try {
        page.drawText(`Page ${i + 1} of ${pageCount}`, {
          x: width - margin - 100,
          y: margin / 2,
          size: 10,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        })
      } catch (e) {
        console.error("Error drawing text:", `Page ${i + 1} of ${pageCount}`, e)
      }

      try {
        page.drawText("SAMAJH Interview Platform", {
          x: margin,
          y: margin / 2,
          size: 10,
          font: helveticaFont,
          color: rgb(0.5, 0.5, 0.5),
        })
      } catch (e) {
        console.error("Error drawing text:", "SAMAJH Interview Platform", e)
      }
    }

    // Serialize the PDF to bytes
    const pdfBytes = await pdfDoc.save()

    // Return the PDF as a response
    return new NextResponse(pdfBytes, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="performance-report-${resultId}.pdf"`,
      },
    })
  } catch (error) {
    console.error("Error generating report:", error)
    // Return a more detailed error message
    return NextResponse.json(
      {
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 },
    )
  }
}

// Helper functions for performance analysis

function calculatePerformanceByDifficulty(test, result) {
  if (!test || !test.questions || !Array.isArray(test.questions) || !result || !result.answers) {
    console.error("Invalid test or result data in calculatePerformanceByDifficulty")
    return {
      easy: { correct: 0, total: 0 },
      intermediate: { correct: 0, total: 0 },
      hard: { correct: 0, total: 0 },
    }
  }

  const performance = {
    easy: { correct: 0, total: 0 },
    intermediate: { correct: 0, total: 0 },
    hard: { correct: 0, total: 0 },
  }

  test.questions.forEach((question) => {
    if (!question) return

    // Use default difficulty if not present
    const difficulty = (question.difficulty || "intermediate") as keyof typeof performance
    performance[difficulty].total++

    if (result.answers[question.id] === question.correct_answer) {
      performance[difficulty].correct++
    }
  })

  return performance
}

function calculateTopicPerformance(resultData: TestResult, testData: TestWithQuestions) {
  if (!testData || !testData.questions || !Array.isArray(testData.questions) || !resultData || !resultData.answers) {
    console.error("Invalid test or result data in calculateTopicPerformance")
    return {}
  }

  const topicPerformance: Record<string, { correct: number; total: number; percentage: number }> = {}

  // Group questions by topic and calculate performance
  testData.questions.forEach((question) => {
    if (!question) return

    const topic = question.topic || testData.topic || "General"

    if (!topicPerformance[topic]) {
      topicPerformance[topic] = { correct: 0, total: 0, percentage: 0 }
    }

    topicPerformance[topic].total++

    if (resultData.answers[question.id] === question.correct_answer) {
      topicPerformance[topic].correct++
    }
  })

  // Calculate percentage for each topic
  Object.keys(topicPerformance).forEach((topic) => {
    const { correct, total } = topicPerformance[topic]
    topicPerformance[topic].percentage = total > 0 ? Math.round((correct / total) * 100) : 0
  })

  return topicPerformance
}

function getTopStrengths(topicPerformance) {
  if (!topicPerformance || typeof topicPerformance !== "object") {
    console.error("Invalid topicPerformance in getTopStrengths")
    return []
  }

  // Sort by percentage
  const topicScores = Object.entries(topicPerformance)
    .map(([topic, data]) => ({
      topic,
      score: data.percentage,
    }))
    .sort((a, b) => b.score - a.score)

  // Get strengths (top 3 with score >= 60%)
  return topicScores.filter((item) => item.score >= 60).slice(0, 3)
}

function getTopWeaknesses(topicPerformance) {
  if (!topicPerformance || typeof topicPerformance !== "object") {
    console.error("Invalid topicPerformance in getTopWeaknesses")
    return []
  }

  // Sort by percentage
  const topicScores = Object.entries(topicPerformance)
    .map(([topic, data]) => ({
      topic,
      score: data.percentage,
    }))
    .sort((a, b) => a.score - b.score)

  // Get weaknesses (bottom 3 with score < 70%)
  return topicScores.filter((item) => item.score < 70).slice(0, 3)
}

// Calculate skill gaps based on question performance
function calculateSkillGaps(resultData, testData) {
  if (!testData || !testData.questions || !Array.isArray(testData.questions) || !resultData || !resultData.answers) {
    console.error("Invalid test or result data in calculateSkillGaps")
    return []
  }

  // Group questions by skills they test
  const skillPerformance = {}

  testData.questions.forEach((question) => {
    if (!question) return

    // Extract skills from question text or use topic as fallback
    const skills = extractSkillsFromQuestion(question) || [question.topic || testData.topic || "General"]

    skills.forEach((skill) => {
      if (!skillPerformance[skill]) {
        skillPerformance[skill] = { correct: 0, total: 0 }
      }

      skillPerformance[skill].total++

      if (resultData.answers[question.id] === question.correct_answer) {
        skillPerformance[skill].correct++
      }
    })
  })

  // Calculate gap score (100 - performance percentage)
  return Object.entries(skillPerformance)
    .map(([skill, data]) => ({
      skill,
      score: 100 - Math.round((data.correct / data.total) * 100),
    }))
    .filter((gap) => gap.score > 20) // Only include significant gaps
    .sort((a, b) => b.score - a.score)
    .slice(0, 5) // Top 5 skill gaps
}

// Extract skills from question text using keywords
function extractSkillsFromQuestion(question) {
  if (!question || !question.text) {
    return null
  }

  const text = question.text.toLowerCase()
  const explanation = (question.explanation || "").toLowerCase()
  const combinedText = text + " " + explanation

  const skillKeywords = {
    "Problem Solving": ["solve", "problem", "solution", "approach", "algorithm"],
    "Critical Thinking": ["analyze", "evaluate", "critique", "reason", "logic"],
    "Technical Knowledge": ["concept", "principle", "theory", "technical", "knowledge"],
    Application: ["apply", "implement", "use", "utilize", "practice"],
    Communication: ["explain", "describe", "articulate", "communicate", "express"],
    "Attention to Detail": ["detail", "specific", "precise", "accuracy", "careful"],
  }

  const matchedSkills = Object.entries(skillKeywords)
    .filter(([_, keywords]) => keywords.some((keyword) => combinedText.includes(keyword)))
    .map(([skill]) => skill)

  return matchedSkills.length > 0 ? matchedSkills : null
}
