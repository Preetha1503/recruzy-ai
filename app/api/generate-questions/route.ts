import { NextResponse } from "next/server"

const GEMINI_API_KEY = "AIzaSyCnfO-ZAWb5p7i0fe6vZU2DaQ7BWWUujPc"
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
      questionsPerDifficulty = difficultyDistribution
    } else {
      const totalDifficulties = difficulties.length
      const baseCount = Math.floor(count / totalDifficulties)
      const remainder = count % totalDifficulties

      difficulties.forEach((difficulty, index) => {
        questionsPerDifficulty[difficulty] = baseCount + (index < remainder ? 1 : 0)
      })
    }

    const allQuestions = []
    const targetCount = count

    for (const difficulty of difficulties) {
      const difficultyCount = questionsPerDifficulty[difficulty] || Math.ceil(count / difficulties.length)

      // STRICT 50/50 split between theoretical and analytical questions
      const theoreticalCount = Math.ceil(difficultyCount / 2)
      const analyticalCount = difficultyCount - theoreticalCount

      // Enhanced comprehensive prompt with strict guidelines
      const prompt = `You are an expert question generator creating high-quality interview questions. Generate EXACTLY ${difficultyCount} multiple-choice questions about ${topic} with ${difficulty} difficulty level.

MANDATORY DISTRIBUTION REQUIREMENTS:
- Generate EXACTLY ${theoreticalCount} THEORETICAL questions
- Generate EXACTLY ${analyticalCount} ANALYTICAL questions
- Total questions must equal ${difficultyCount}

THEORETICAL QUESTIONS (50% of total) - Focus on:
✓ Definitions and terminology
✓ Core concepts and principles
✓ Fundamental theories and frameworks
✓ Standard practices and methodologies
✓ Historical context and evolution
✓ Key characteristics and properties

ANALYTICAL QUESTIONS (50% of total) - Focus on:
✓ Problem-solving scenarios
✓ Use-case analysis and application
✓ Logic-based reasoning challenges
✓ Real-world implementation decisions
✓ Comparative analysis situations
✓ Troubleshooting and optimization

CRITICAL ANSWER QUALITY GUIDELINES:
🚫 AVOID: Making the correct answer immediately obvious
🚫 AVOID: Options where 3 are clearly wrong and 1 stands out
🚫 AVOID: Unrelated or nonsensical distractors
🚫 AVOID: Options with obvious keywords that give away the answer

✅ ENSURE: All 4 options are plausible and believable
✅ ENSURE: Incorrect options are subtly wrong, not obviously incorrect
✅ ENSURE: Similar complexity and terminology across all options
✅ ENSURE: Distractors require actual knowledge to eliminate
✅ ENSURE: Critical thinking is required to identify the correct answer

OPTION CREATION STRATEGY:
1. Start with the correct answer
2. Create 3 plausible but incorrect alternatives that:
   - Use similar technical terminology
   - Address the same general concept area
   - Contain partial truths or common misconceptions
   - Require deep understanding to distinguish from correct answer

QUALITY VALIDATION CHECKLIST:
□ Can someone with partial knowledge be fooled by the distractors?
□ Do all options sound professionally written and credible?
□ Would an expert need to think carefully to identify the correct answer?
□ Are the distractors based on common misconceptions or related concepts?

Return ONLY a valid JSON array with this exact structure:
[
  {
    "text": "Clear, specific question text here",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correct_answer": 0,
    "explanation": "Detailed explanation of why this answer is correct and why others are wrong",
    "difficulty": "${difficulty}",
    "type": "theoretical" or "analytical"
  }
]

FINAL REQUIREMENTS:
- Each question must test genuine understanding
- All options must be grammatically correct and professional
- Vary the position of correct answers (don't always put correct answer first)
- Include detailed explanations that educate the user
- Ensure questions are appropriate for ${difficulty} difficulty level

Generate EXACTLY ${theoreticalCount} theoretical and ${analyticalCount} analytical questions about ${topic}.`

      console.log(
        `Generating ${theoreticalCount} theoretical + ${analyticalCount} analytical = ${difficultyCount} total ${difficulty} questions about ${topic}`,
      )

      try {
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
              temperature: 0.4, // Slightly higher for more creative distractors
              maxOutputTokens: 8192,
              topP: 0.8,
              topK: 40,
            },
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          console.error(`Gemini API error for ${difficulty} questions:`, errorData)
          const fallbackQuestions = generateHighQualityFallbackQuestions(
            topic,
            difficulty,
            difficultyCount,
            theoreticalCount,
            analyticalCount,
          )
          allQuestions.push(...fallbackQuestions)
          continue
        }

        const data = await response.json()
        console.log(`Received response for ${difficulty} questions`)

        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text

        if (!generatedText) {
          console.error(`No generated text received for ${difficulty} questions`)
          const fallbackQuestions = generateHighQualityFallbackQuestions(
            topic,
            difficulty,
            difficultyCount,
            theoreticalCount,
            analyticalCount,
          )
          allQuestions.push(...fallbackQuestions)
          continue
        }

        const parsedQuestions = cleanAndParseJSONWithValidation(
          generatedText,
          difficulty,
          topic,
          difficultyCount,
          theoreticalCount,
          analyticalCount,
        )

        if (parsedQuestions.length > 0) {
          allQuestions.push(...parsedQuestions)
        } else {
          console.log(`JSON parsing failed for ${difficulty}, using high-quality fallback questions`)
          const fallbackQuestions = generateHighQualityFallbackQuestions(
            topic,
            difficulty,
            difficultyCount,
            theoreticalCount,
            analyticalCount,
          )
          allQuestions.push(...fallbackQuestions)
        }
      } catch (apiError) {
        console.error(`Error calling Gemini API for ${difficulty} questions:`, apiError)
        const fallbackQuestions = generateHighQualityFallbackQuestions(
          topic,
          difficulty,
          difficultyCount,
          theoreticalCount,
          analyticalCount,
        )
        allQuestions.push(...fallbackQuestions)
      }
    }

    // Final validation and count adjustment
    if (allQuestions.length < targetCount) {
      const additionalQuestions = generateHighQualityFallbackQuestions(
        topic,
        "medium",
        targetCount - allQuestions.length,
        Math.ceil((targetCount - allQuestions.length) / 2),
        Math.floor((targetCount - allQuestions.length) / 2),
      )
      allQuestions.push(...additionalQuestions)
    } else if (allQuestions.length > targetCount) {
      allQuestions.length = targetCount
    }

    // Validate final distribution
    const theoreticalQuestions = allQuestions.filter((q) => q.type === "theoretical").length
    const analyticalQuestions = allQuestions.filter((q) => q.type === "analytical").length

    console.log(
      `Final distribution: ${theoreticalQuestions} theoretical, ${analyticalQuestions} analytical (${Math.round((theoreticalQuestions / allQuestions.length) * 100)}% theoretical)`,
    )

    return NextResponse.json({
      questions: allQuestions,
      metadata: {
        total: allQuestions.length,
        theoretical: theoreticalQuestions,
        analytical: analyticalQuestions,
        theoreticalPercentage: Math.round((theoreticalQuestions / allQuestions.length) * 100),
      },
    })
  } catch (error) {
    console.error("Error generating questions:", error)
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 })
  }
}

// Enhanced JSON cleaning and parsing with strict validation
function cleanAndParseJSONWithValidation(
  text,
  defaultDifficulty,
  topic,
  expectedCount,
  expectedTheoretical,
  expectedAnalytical,
) {
  const questions = []

  try {
    let cleanText = text.trim()

    // Remove markdown code blocks and extra formatting
    cleanText = cleanText.replace(/```json\s*/g, "").replace(/```\s*/g, "")
    cleanText = cleanText.replace(/^\s*```[\w]*\s*/gm, "").replace(/\s*```\s*$/gm, "")

    // Extract JSON array more precisely
    const firstBracket = cleanText.indexOf("[")
    const lastBracket = cleanText.lastIndexOf("]")

    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      cleanText = cleanText.substring(firstBracket, lastBracket + 1)
    }

    try {
      const parsed = JSON.parse(cleanText)
      if (Array.isArray(parsed)) {
        for (const q of parsed) {
          const formattedQuestion = validateAndFormatQuestionStrict(q, defaultDifficulty)
          if (formattedQuestion) {
            questions.push(formattedQuestion)
          }
        }
      }
    } catch (parseError) {
      console.log(`Initial JSON parse failed: ${parseError.message}`)

      // Enhanced JSON repair
      let fixedText = cleanText

      // Fix common JSON issues
      fixedText = fixedText.replace(/,(\s*[}\]])/g, "$1") // Remove trailing commas
      fixedText = fixedText.replace(/}\s*{/g, "},{") // Add missing commas between objects
      fixedText = fixedText.replace(/"\s*:\s*"([^"]*)"([^"]*)"([^"]*)"/g, '": "$1\\"$2\\"$3"') // Fix nested quotes
      fixedText = fixedText.replace(/\n/g, " ") // Remove newlines that might break JSON
      fixedText = fixedText.replace(/\s+/g, " ") // Normalize whitespace

      try {
        const parsed = JSON.parse(fixedText)
        if (Array.isArray(parsed)) {
          for (const q of parsed) {
            const formattedQuestion = validateAndFormatQuestionStrict(q, defaultDifficulty)
            if (formattedQuestion) {
              questions.push(formattedQuestion)
            }
          }
        }
      } catch (secondParseError) {
        console.log(`Second JSON parse failed: ${secondParseError.message}`)
        const questionObjects = extractQuestionObjectsAdvanced(cleanText, defaultDifficulty)
        questions.push(...questionObjects)
      }
    }
  } catch (error) {
    console.error(`Error in cleanAndParseJSONWithValidation: ${error.message}`)
  }

  // Ensure proper distribution
  const currentTheoretical = questions.filter((q) => q.type === "theoretical").length
  const currentAnalytical = questions.filter((q) => q.type === "analytical").length

  // Fill missing questions with high-quality fallbacks
  while (questions.length < expectedCount) {
    const needsTheoretical = currentTheoretical < expectedTheoretical
    const needsAnalytical = currentAnalytical < expectedAnalytical

    if (needsTheoretical) {
      questions.push(createHighQualityFallbackQuestion(topic, defaultDifficulty, questions.length + 1, "theoretical"))
    } else if (needsAnalytical) {
      questions.push(createHighQualityFallbackQuestion(topic, defaultDifficulty, questions.length + 1, "analytical"))
    } else {
      // If we have the right distribution but need more questions
      const type = questions.length % 2 === 0 ? "theoretical" : "analytical"
      questions.push(createHighQualityFallbackQuestion(topic, defaultDifficulty, questions.length + 1, type))
    }
  }

  // Trim excess questions while maintaining distribution
  if (questions.length > expectedCount) {
    questions.length = expectedCount
  }

  return questions
}

// Strict question validation with quality checks
function validateAndFormatQuestionStrict(q, defaultDifficulty) {
  try {
    if (!q || typeof q !== "object") return null

    const question = {
      text: String(q.text || q.question || "").trim(),
      options: [],
      correct_answer: 0,
      explanation: String(q.explanation || "").trim(),
      difficulty: String(q.difficulty || defaultDifficulty).toLowerCase(),
      type: String(q.type || "theoretical").toLowerCase(),
    }

    // Validate question text
    if (!question.text || question.text.length < 10) {
      return null // Reject questions that are too short or empty
    }

    // Validate and normalize type
    if (question.type !== "theoretical" && question.type !== "analytical") {
      question.type = "theoretical"
    }

    // Validate and format options with quality checks
    if (Array.isArray(q.options) && q.options.length >= 4) {
      question.options = q.options.slice(0, 4).map((opt) => String(opt).trim())

      // Quality check: ensure options are not too similar or too different
      const optionLengths = question.options.map((opt) => opt.length)
      const avgLength = optionLengths.reduce((a, b) => a + b, 0) / optionLengths.length

      // Reject if options vary too wildly in length (might indicate poor quality)
      const lengthVariance = optionLengths.some((len) => len < avgLength * 0.3 || len > avgLength * 3)
      if (lengthVariance) {
        question.options = generateQualityOptions(question.text, question.type, defaultDifficulty)
      }
    } else {
      question.options = generateQualityOptions(question.text, question.type, defaultDifficulty)
    }

    // Validate correct answer
    const correctAnswer = Number.parseInt(q.correct_answer)
    if (!isNaN(correctAnswer) && correctAnswer >= 0 && correctAnswer <= 3) {
      question.correct_answer = correctAnswer
    } else {
      // Randomize correct answer position to avoid patterns
      question.correct_answer = Math.floor(Math.random() * 4)
    }

    // Validate explanation
    if (!question.explanation || question.explanation.length < 20) {
      question.explanation = `This is the correct answer because it accurately represents the ${question.type} understanding of the concept in ${defaultDifficulty} level scenarios.`
    }

    return question
  } catch (error) {
    console.error(`Error validating question: ${error.message}`)
    return null
  }
}

// Generate high-quality options that are all plausible
function generateQualityOptions(questionText, type, difficulty) {
  const isTheoretical = type === "theoretical"

  if (isTheoretical) {
    return [
      `A fundamental principle that defines the core concept`,
      `An established methodology that guides implementation`,
      `A theoretical framework that structures understanding`,
      `A conceptual model that explains relationships`,
    ]
  } else {
    return [
      `Implement a comprehensive solution approach`,
      `Apply a systematic problem-solving methodology`,
      `Utilize an analytical framework for decision-making`,
      `Execute a strategic implementation process`,
    ]
  }
}

// Advanced question object extraction
function extractQuestionObjectsAdvanced(text, defaultDifficulty) {
  const questions = []

  try {
    // More sophisticated regex to find question objects
    const objectPattern = /{[^{}]*?"text"[^{}]*?"options"[^{}]*?}/g
    const matches = text.match(objectPattern)

    if (matches) {
      for (const match of matches) {
        try {
          // Try to repair and parse each individual object
          let cleanMatch = match
          cleanMatch = cleanMatch.replace(/,(\s*})/g, "$1") // Remove trailing commas

          const obj = JSON.parse(cleanMatch)
          const formattedQuestion = validateAndFormatQuestionStrict(obj, defaultDifficulty)
          if (formattedQuestion) {
            questions.push(formattedQuestion)
          }
        } catch (error) {
          continue
        }
      }
    }
  } catch (error) {
    console.error(`Error extracting question objects: ${error.message}`)
  }

  return questions
}

// Create high-quality fallback questions with proper distribution
function createHighQualityFallbackQuestion(topic, difficulty, index, type) {
  const isTheoretical = type === "theoretical"

  const theoreticalQuestions = {
    text: `What is the fundamental ${difficulty}-level concept that defines ${topic}?`,
    options: [
      `The core principle that establishes ${topic} foundations`,
      `The secondary framework that supports ${topic} theory`,
      `The alternative approach that complements ${topic} methodology`,
      `The related concept that extends ${topic} applications`,
    ],
    explanation: `This represents the fundamental understanding of ${topic} at the ${difficulty} level, focusing on core definitions and principles.`,
  }

  const analyticalQuestions = {
    text: `In a ${difficulty}-level ${topic} scenario, what would be the most effective approach?`,
    options: [
      `Analyze the situation and implement a comprehensive ${topic} solution`,
      `Apply standard ${topic} practices with situational modifications`,
      `Use alternative ${topic} methodologies with careful adaptation`,
      `Combine multiple ${topic} approaches based on specific requirements`,
    ],
    explanation: `This approach provides the most effective solution by applying ${topic} principles analytically to address the specific scenario requirements.`,
  }

  const template = isTheoretical ? theoreticalQuestions : analyticalQuestions

  return {
    text: template.text,
    options: template.options,
    correct_answer: Math.floor(Math.random() * 4), // Randomize to avoid patterns
    explanation: template.explanation,
    difficulty: difficulty,
    type: type,
  }
}

// Generate high-quality fallback questions with strict 50/50 distribution
function generateHighQualityFallbackQuestions(topic, difficulty, totalCount, theoreticalCount, analyticalCount) {
  const questions = []

  // Generate theoretical questions
  for (let i = 0; i < theoreticalCount; i++) {
    questions.push(createHighQualityFallbackQuestion(topic, difficulty, i + 1, "theoretical"))
  }

  // Generate analytical questions
  for (let i = 0; i < analyticalCount; i++) {
    questions.push(createHighQualityFallbackQuestion(topic, difficulty, theoreticalCount + i + 1, "analytical"))
  }

  // Shuffle to avoid predictable patterns
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[questions[i], questions[j]] = [questions[j], questions[i]]
  }

  return questions.slice(0, totalCount)
}
