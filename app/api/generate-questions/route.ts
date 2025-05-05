import { NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyCnfO-ZAWb5p7i0fe6vZU2DaQ7BWWUujPc"
// Updated to use the correct model name and API endpoint
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

export async function POST(request) {
  try {
    const { topic, difficulties, count = 45, difficultyDistribution = null } = await request.json()

    if (!topic || !difficulties || !difficulties.length) {
      return NextResponse.json({ error: "Topic and at least one difficulty level are required" }, { status: 400 })
    }

    // Calculate how many questions to generate for each difficulty level
    let questionsPerDifficulty = {}

    if (difficultyDistribution) {
      // Use provided distribution
      questionsPerDifficulty = difficultyDistribution
    } else {
      // Default balanced distribution
      const totalDifficulties = difficulties.length
      const baseCount = Math.floor(count / totalDifficulties)
      const remainder = count % totalDifficulties

      difficulties.forEach((difficulty, index) => {
        // Distribute remainder evenly
        questionsPerDifficulty[difficulty] = baseCount + (index < remainder ? 1 : 0)
      })
    }

    // Generate prompts for each difficulty level
    const allQuestions = []
    const targetCount = count // Store the target count for validation later

    for (const difficulty of difficulties) {
      const difficultyCount = questionsPerDifficulty[difficulty] || Math.ceil(count / difficulties.length)

      // Format the prompt for Gemini to generate multiple-choice questions for this difficulty
      const prompt = `Generate EXACTLY ${difficultyCount} multiple-choice interview questions about ${topic} with difficulty level: ${difficulty}. 

      For each question, provide:
      1. The question text
      2. Four possible answer options (labeled as options array)
      3. The correct answer (as an index 0-3)
      4. A brief explanation of why the correct answer is correct
      5. The difficulty level (${difficulty})
      
      Format your response EXACTLY as a valid JSON array with objects containing these fields:
      - "text": the question text (string)
      - "options": an array of 4 strings representing the possible answers
      - "correct_answer": the index (0-3) of the correct option (number)
      - "explanation": explanation of the correct answer (string)
      - "difficulty": the difficulty level (string)
      
      Make sure the questions are challenging and test deep understanding of ${topic}.
      IMPORTANT: Your response must be a valid JSON array that can be parsed with JSON.parse().
      Do not include any text before or after the JSON array.
      Do not use markdown formatting.
      Do not use backticks.
      Do not include any explanations outside the JSON array.
      MOST IMPORTANT: Generate EXACTLY ${difficultyCount} questions, no more and no less.`

      console.log(`Sending request to Gemini API for ${difficultyCount} ${difficulty} questions about ${topic}`)

      // Call the Gemini API
      const response = await fetch(GEMINI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": GEMINI_API_KEY,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 8192, // Increased token limit for more questions
          },
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error(`Gemini API error for ${difficulty} questions:`, errorData)
        continue // Try the next difficulty level
      }

      const data = await response.json()
      console.log(`Received response for ${difficulty} questions`)

      // Extract the generated text from the response
      const generatedText = data.candidates[0].content.parts[0].text

      // Try to clean up the response to get valid JSON
      let jsonStr = generatedText.trim()

      // Remove any markdown code block markers
      jsonStr = jsonStr.replace(/```json|```/g, "").trim()

      // Try to find JSON array in the response
      const jsonMatch = jsonStr.match(/\[\s*\{[\s\S]*\}\s*\]/)
      if (jsonMatch) {
        jsonStr = jsonMatch[0]
      }

      try {
        // Try to parse the JSON
        const difficultyQuestions = JSON.parse(jsonStr)

        // Validate and format the questions
        const formattedQuestions = difficultyQuestions.map((q) => ({
          text: q.text || "Question text not provided",
          options:
            Array.isArray(q.options) && q.options.length === 4
              ? q.options
              : ["Option A", "Option B", "Option C", "Option D"],
          correct_answer:
            typeof q.correct_answer === "number" && q.correct_answer >= 0 && q.correct_answer <= 3
              ? q.correct_answer
              : 0,
          explanation: q.explanation || "No explanation provided",
          difficulty: difficulty,
        }))

        // Make sure we get exactly the number of questions requested
        if (formattedQuestions.length < difficultyCount) {
          // If we got fewer questions than requested, generate additional ones
          const additionalQuestions = generateSampleQuestions(
            topic,
            [difficulty],
            difficultyCount - formattedQuestions.length,
          )
          formattedQuestions.push(...additionalQuestions)
        } else if (formattedQuestions.length > difficultyCount) {
          // If we got more questions than requested, trim the excess
          formattedQuestions.length = difficultyCount
        }

        allQuestions.push(...formattedQuestions)
      } catch (e) {
        console.error(`Failed to parse JSON for ${difficulty} questions:`, e)
        console.log("Raw response:", generatedText)

        // If JSON parsing fails, try to manually extract questions
        const manualQuestions = parseMultipleChoiceQuestionsFromText(generatedText, difficulty)

        // Ensure we get exactly the number of questions requested
        if (manualQuestions.length < difficultyCount) {
          // If we got fewer questions than requested, generate additional ones
          const additionalQuestions = generateSampleQuestions(
            topic,
            [difficulty],
            difficultyCount - manualQuestions.length,
          )
          manualQuestions.push(...additionalQuestions)
        } else if (manualQuestions.length > difficultyCount) {
          // If we got more questions than requested, trim the excess
          manualQuestions.length = difficultyCount
        }

        allQuestions.push(...manualQuestions)
      }
    }

    // Final check to ensure we have exactly the requested number of questions
    if (allQuestions.length < targetCount) {
      // If we still don't have enough questions, generate additional sample ones
      const additionalQuestions = generateSampleQuestions(topic, difficulties, targetCount - allQuestions.length)
      allQuestions.push(...additionalQuestions)
    } else if (allQuestions.length > targetCount) {
      // If we have too many questions, trim the excess
      allQuestions.length = targetCount
    }

    return NextResponse.json({ questions: allQuestions })
  } catch (error) {
    console.error("Error generating questions:", error)
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
  }
}

// Fallback function to parse multiple-choice questions if JSON parsing fails
function parseMultipleChoiceQuestionsFromText(text, defaultDifficulty) {
  const questions = []

  // Try to identify question blocks
  const questionBlocks = text.split(/\d+\.\s+/).filter(Boolean)

  for (const block of questionBlocks) {
    try {
      // Extract question text
      const questionMatch = block.match(/(.+?)(?=Options:|A\.|$)/is)
      const questionText = questionMatch ? questionMatch[1].trim() : "Question text not found"

      // Extract options
      const options = []
      const optionMatches = block.match(/[A-D]\.?\s+(.+?)(?=[A-D]\.|\n|$)/g)

      if (optionMatches && optionMatches.length > 0) {
        for (const optionMatch of optionMatches) {
          const optionText = optionMatch.replace(/^[A-D]\.?\s+/, "").trim()
          options.push(optionText)
        }
      }

      // If we couldn't extract options, provide defaults
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`)
      }

      // Extract correct answer
      let correctAnswer = 0
      const correctAnswerMatch = block.match(/correct\s+answer\s*:?\s*([A-D])/i)
      if (correctAnswerMatch) {
        const letter = correctAnswerMatch[1].toUpperCase()
        correctAnswer = letter.charCodeAt(0) - 65 // Convert A->0, B->1, etc.
      }

      // Extract explanation
      const explanationMatch = block.match(/explanation\s*:?\s*(.+?)(?=difficulty|$)/is)
      const explanation = explanationMatch ? explanationMatch[1].trim() : "No explanation provided"

      questions.push({
        text: questionText,
        options,
        correct_answer: correctAnswer,
        explanation,
        difficulty: defaultDifficulty,
      })
    } catch (e) {
      console.error("Error parsing question block:", e)
    }
  }

  return questions
}

// Generate sample questions if all else fails
function generateSampleQuestions(topic, difficulties, count) {
  const questions = []
  const questionsPerDifficulty = Math.ceil(count / difficulties.length)
  let remainingCount = count

  for (const difficulty of difficulties) {
    // Calculate how many questions to generate for this difficulty
    const difficultyCount = Math.min(questionsPerDifficulty, remainingCount)

    for (let i = 0; i < difficultyCount; i++) {
      questions.push({
        text: `Sample ${difficulty} question ${i + 1} about ${topic}`,
        options: [
          `Option A for ${difficulty} question ${i + 1}`,
          `Option B for ${difficulty} question ${i + 1}`,
          `Option C for ${difficulty} question ${i + 1}`,
          `Option D for ${difficulty} question ${i + 1}`,
        ],
        correct_answer: 0,
        explanation: `This is a sample explanation for ${difficulty} question ${i + 1}. The correct answer is A.`,
        difficulty: difficulty,
      })
    }

    remainingCount -= difficultyCount
    if (remainingCount <= 0) break
  }

  return questions
}
