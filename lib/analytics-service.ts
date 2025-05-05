import { GEMINI_API_KEY } from "@/lib/constants"

// The base URL for the Gemini API
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"

export interface UserAnalytics {
  topicPerformance: {
    topic: string
    score: number
    tests: number
    trend: number
  }[]
  testResults: {
    id: string
    score: number
    completed_at: string
    tests: {
      title: string
    }
  }[]
}

// Function to generate insights from test results using Gemini API
async function generateInsights(data: any, prompt: string): Promise<string> {
  try {
    console.log("Generating insights with data type:", typeof data)
    console.log("Data sample:", JSON.stringify(data).substring(0, 200) + "...")

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
                text: `${prompt}\n\nData: ${JSON.stringify(data, null, 2)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Gemini API error:", errorData)
      return "Failed to generate insights. Please try again later."
    }

    const result = await response.json()

    if (
      !result.candidates ||
      !result.candidates[0] ||
      !result.candidates[0].content ||
      !result.candidates[0].content.parts
    ) {
      console.error("Unexpected Gemini API response structure:", result)
      return "Failed to generate insights due to unexpected API response."
    }

    // Clean the response text to handle markdown formatting
    let text = result.candidates[0].content.parts[0].text

    // Remove markdown formatting symbols
    text = text.replace(/\*\*/g, "") // Remove bold markers
    text = text.replace(/\*/g, "") // Remove italic markers
    text = text.replace(/#+\s/g, "") // Remove heading markers
    text = text.replace(/```json|```/g, "") // Remove code blocks

    return text.trim()
  } catch (error) {
    console.error("Error generating insights:", error)
    return "An error occurred while generating insights."
  }
}

// Function to generate recommendations based on user performance
export async function generateRecommendations(
  topicPerformance: { topic: string; score: number; tests: number }[],
): Promise<string[]> {
  try {
    const prompt = `
      Based on the user's performance in different topics, provide 5 specific, actionable recommendations 
      to help them improve. Focus on the topics with the lowest scores, but also suggest ways to maintain 
      performance in stronger areas. Each recommendation should be concise (1-2 sentences) and specific.
      
      Format your response as a JSON array of strings, with each string being a recommendation.
      Do not include any explanations, markdown formatting, or additional text outside the JSON array.
      Do not wrap your response in code blocks or backticks.
    `

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
                text: `${prompt}\n\nTopic Performance: ${JSON.stringify(topicPerformance, null, 2)}`,
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 1024,
        },
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error("Gemini API error:", errorData)
      return [
        "Focus on improving your understanding of topics with lower scores.",
        "Review explanations for questions you answered incorrectly.",
        "Take more tests to improve your performance.",
        "Consider studying additional resources for challenging topics.",
        "Practice regularly to maintain your skills.",
      ]
    }

    const result = await response.json()
    const text = result.candidates[0].content.parts[0].text

    try {
      // Clean the response text to handle markdown formatting
      let cleanedText = text.trim()

      // Remove markdown code block markers if present
      cleanedText = cleanedText.replace(/```json|```/g, "").trim()

      // Try to find a JSON array in the response
      const jsonMatch = cleanedText.match(/\[\s*".*"\s*\]/s)
      if (jsonMatch) {
        cleanedText = jsonMatch[0]
      }

      // Parse the JSON
      const recommendations = JSON.parse(cleanedText)

      if (Array.isArray(recommendations) && recommendations.length > 0) {
        return recommendations.slice(0, 5)
      }
    } catch (e) {
      console.error("Error parsing recommendations:", e)
      console.log("Raw response:", text)
    }

    // Fallback recommendations
    return [
      "Focus on improving your understanding of topics with lower scores.",
      "Review explanations for questions you answered incorrectly.",
      "Take more tests to improve your performance.",
      "Consider studying additional resources for challenging topics.",
      "Practice regularly to maintain your skills.",
    ]
  } catch (error) {
    console.error("Error generating recommendations:", error)
    return [
      "Focus on improving your understanding of topics with lower scores.",
      "Review explanations for questions you answered incorrectly.",
      "Take more tests to improve your performance.",
      "Consider studying additional resources for challenging topics.",
      "Practice regularly to maintain your skills.",
    ]
  }
}

// Function to analyze test results for admin dashboard
export async function analyzeTestResults(results: any[]): Promise<string> {
  const prompt = `
    Analyze the following test results data and provide insights for an admin dashboard.
    Focus on:
    1. Overall performance trends
    2. Identification of common areas of difficulty
    3. Suggestions for improving test content
    4. Any notable patterns in user performance
    
    Keep your analysis concise and actionable, with 3-5 key insights.
  `

  return generateInsights(results, prompt)
}

// Function to analyze user performance for personalized feedback
export async function analyzeUserPerformance(results: any[]): Promise<string> {
  console.log("Analyzing user performance with data:", {
    resultCount: Array.isArray(results) ? results.length : "not an array",
    dataType: typeof results,
  })

  const prompt = `
    Analyze the following test results for a single user and provide personalized feedback.
    Focus on:
    1. Strengths and weaknesses based on topic performance
    2. Progress over time
    3. Specific areas to focus on for improvement
    4. Positive reinforcement of achievements
    
    Format your response with clear sections for:
    - Strengths: List each strength with a brief explanation of why they're doing well in this area
    - Weaknesses: List each weakness with specific details about what they need to improve
    
    Keep your analysis encouraging, specific, and actionable, with 3-4 key insights.
  `

  return generateInsights(results, prompt)
}

import { supabaseServer } from "@/lib/supabase/server"

// Add detailed logging to the getUserAnalytics function
// Around line 150-200

export async function getUserAnalytics(userId: string): Promise<UserAnalytics> {
  console.log(`Getting analytics for user ${userId}`)

  try {
    // Fetch test results for the user
    console.log(`Fetching test results for user ${userId}`)
    const { data: testResults, error: resultsError } = await supabaseServer
      .from("test_results")
      .select(`
        id,
        score,
        completed_at,
        test_id,
        tests (
          id,
          title,
          topic
        )
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (resultsError) {
      console.error("Error fetching test results:", resultsError)
      return {
        topicPerformance: [],
        testResults: [],
      }
    }

    console.log(`Found ${testResults?.length || 0} test results for user ${userId}`)

    // Process topic performance
    const topicScores: Record<string, { scores: number[]; count: number }> = {}

    testResults?.forEach((result) => {
      if (!result.tests) return // Skip if test data is missing

      const topic = result.tests.topic || "Unknown"

      if (!topicScores[topic]) {
        topicScores[topic] = { scores: [], count: 0 }
      }

      topicScores[topic].scores.push(result.score)
      topicScores[topic].count++
    })

    // Calculate topic performance with trends
    const topicPerformance = Object.entries(topicScores).map(([topic, data]) => {
      if (data.scores.length === 0) {
        return {
          topic,
          score: 0,
          tests: 0,
          trend: 0,
        }
      }

      const scores = data.scores
      const avgScore = Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)

      // Calculate trend (difference between latest and earliest score)
      let trend = 0
      if (scores.length > 1) {
        trend = scores[0] - scores[scores.length - 1]
      }

      return {
        topic,
        score: avgScore,
        tests: data.count,
        trend,
      }
    })

    console.log("Processed topic performance:", topicPerformance)

    // Log top performers
    const topPerformers = [...topicPerformance].sort((a, b) => b.score - a.score).slice(0, 3)
    console.log("Top performing topics:", topPerformers)

    return {
      topicPerformance,
      testResults: testResults || [],
    }
  } catch (error) {
    console.error("Error in getUserAnalytics:", error)
    return {
      topicPerformance: [],
      testResults: [],
    }
  }
}
