import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"
import { GEMINI_API_KEY } from "@/lib/constants"

export async function GET(request: Request) {
  try {
    // Check if user is admin
    const role = cookies().get("role")?.value

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get parameters from the request
    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get("reportType")
    const period = searchParams.get("period")
    const selectedUser = searchParams.get("selectedUser")
    const selectedTest = searchParams.get("selectedTest")

    console.log("Report generation request:", { reportType, period, selectedUser, selectedTest })

    // Validate parameters
    if (!reportType || (reportType === "performance" && !selectedUser) || (reportType === "test" && !selectedTest)) {
      return NextResponse.json({ error: "Invalid parameters" }, { status: 400 })
    }

    let data: any = {}

    if (reportType === "performance") {
      // Fetch user data
      const { data: userData, error: userError } = await supabaseServer
        .from("users")
        .select("id, username, email, created_at")
        .eq("id", selectedUser)
        .single()

      if (userError) {
        console.error("Error fetching user:", userError)
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 })
      }

      if (!userData) {
        return NextResponse.json({ error: "User not found" }, { status: 404 })
      }

      // Fetch test results for this user
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
        .eq("user_id", selectedUser)
        .order("completed_at", { ascending: false })

      if (resultsError) {
        console.error("Error fetching test results:", resultsError)
        return NextResponse.json({ error: "Failed to fetch test results" }, { status: 500 })
      }

      // Calculate statistics
      const totalTests = testResults.length
      const allScores = testResults.map((r) => r.score)
      const averageScore =
        allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0

      // Calculate topic performance
      const topicScores: Record<string, { scores: number[]; count: number }> = {}

      testResults.forEach((result) => {
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

      data = {
        type: "User Performance Report",
        reportTitle: `Performance Report for ${userData.username}`,
        reportDescription: `Performance summary for ${userData.username}`,
        reportDate: new Date().toLocaleDateString(),
        user: userData,
        results: testResults,
        totalTests: totalTests,
        averageScore: averageScore,
        topicPerformance: topicPerformance,
      }

      // Generate AI insights
      const prompt = `
       You are an AI assistant specialized in generating reports. Based on the following data, generate a comprehensive report:
       User: ${userData.username}
       Email: ${userData.email}
       Total Tests Completed: ${totalTests}
       Average Score: ${averageScore}%
       Test Results: ${JSON.stringify(testResults)}

       Provide a detailed report including:
       1. A summary of the user's performance
       2. Key strengths and weaknesses
       3. Recommendations for improvement

       Format your response in plain text without any markdown formatting (no #, ##, **, etc.).
       Do not use any special formatting characters like asterisks, hashtags, or backticks.
       Use simple numbered lists (1., 2., etc.) and clear section titles.
       
       IMPORTANT: Do not include any numerical values or percentages in your insights. Focus on qualitative analysis only.
     `

      try {
        console.log("Sending request to Gemini API with prompt:", prompt)
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
          {
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
                maxOutputTokens: 2048,
              },
            }),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Gemini API error:", errorData)
          data.aiInsights = `Gemini API Error: ${errorData.error || "Unknown error"}`
        } else {
          const result = await response.json()
          console.log("Gemini API raw response:", JSON.stringify(result)) // Log the raw response

          if (
            result &&
            result.candidates &&
            result.candidates[0] &&
            result.candidates[0].content &&
            result.candidates[0].content.parts &&
            result.candidates[0].content.parts[0].text
          ) {
            let text = result.candidates[0].content.parts[0].text

            // Clean up any markdown formatting that might still be present
            text = text.replace(/#+\s/g, "") // Remove heading markers
            text = text.replace(/\*\*/g, "") // Remove bold markers
            text = text.replace(/\*/g, "") // Remove italic markers
            text = text.replace(/`/g, "") // Remove code markers
            text = text.replace(/```/g, "") // Remove code block markers

            // Remove any numerical percentages from the insights
            text = text.replace(/\d+%/g, "")
            text = text.replace(/\d+\.\d+%/g, "")

            data.aiInsights = text
          } else {
            console.warn("Gemini API response missing expected fields")
            data.aiInsights = "Failed to generate AI insights due to unexpected API response."
          }
        }
      } catch (aiError) {
        console.error("Error generating AI insights:", aiError)
        data.aiInsights = `Failed to generate AI insights: ${aiError instanceof Error ? aiError.message : "Unknown error"}`
      }
    } else if (reportType === "test") {
      // Fetch test data
      const { data: testData, error: testError } = await supabaseServer
        .from("tests")
        .select("id, title, topic, description, duration, created_at, status")
        .eq("id", selectedTest)
        .single()

      if (testError) {
        console.error("Error fetching test:", testError)
        return NextResponse.json({ error: "Failed to fetch test" }, { status: 500 })
      }

      if (!testData) {
        return NextResponse.json({ error: "Test not found" }, { status: 404 })
      }

      // Fetch test results for this test
      const { data: testResults, error: resultsError } = await supabaseServer
        .from("test_results")
        .select(`
          id,
          score,
          completed_at,
          user_id,
          users (
            id,
            username,
            email
          )
        `)
        .eq("test_id", selectedTest)
        .order("completed_at", { ascending: false })

      if (resultsError) {
        console.error("Error fetching test results:", resultsError)
        return NextResponse.json({ error: "Failed to fetch test results" }, { status: 500 })
      }

      // Calculate statistics
      const participantCount = testResults.length
      const allScores = testResults.map((r) => r.score)
      const averageScore =
        allScores.length > 0 ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length) : 0

      // Calculate score distribution
      const scoreDistribution = {
        excellent: testResults.filter((r) => r.score >= 90).length,
        good: testResults.filter((r) => r.score >= 70 && r.score < 90).length,
        average: testResults.filter((r) => r.score >= 50 && r.score < 70).length,
        poor: testResults.filter((r) => r.score < 50).length,
      }

      // Calculate performance over time
      const performanceOverTime = testResults
        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime())
        .map((result) => ({
          date: new Date(result.completed_at).toLocaleDateString(),
          score: result.score,
        }))

      // Get top performers
      const topPerformers = [...testResults]
        .sort((a, b) => b.score - a.score)
        .slice(0, 5)
        .map((result) => ({
          username: result.users?.username || "Unknown",
          score: result.score,
        }))

      data = {
        type: "Test Analysis Report",
        reportTitle: `Test Analysis: ${testData.title}`,
        reportDescription: `Analysis of test performance for ${testData.title}`,
        reportDate: new Date().toLocaleDateString(),
        test: testData,
        results: testResults,
        participantCount: participantCount,
        averageScore: averageScore,
        scoreDistribution: scoreDistribution,
        performanceOverTime: performanceOverTime,
        topPerformers: topPerformers,
      }

      // Generate AI insights
      const prompt = `
        You are an AI assistant specialized in generating reports. Based on the following data, generate a comprehensive test analysis report:
        Test: ${testData.title}
        Topic: ${testData.topic}
        Total Participants: ${participantCount}
        Average Score: ${averageScore}%
        Score Distribution: ${JSON.stringify(scoreDistribution)}
        Test Results: ${JSON.stringify(testResults)}

        Provide a detailed report including:
        1. A summary of the test performance
        2. Key insights about participant performance
        3. Recommendations for improving the test or training participants

        Format your response in plain text without any markdown formatting (no #, ##, **, etc.).
        Do not use any special formatting characters like asterisks, hashtags, or backticks.
        Use simple numbered lists (1., 2., etc.) and clear section titles.
        
        IMPORTANT: Do not include any numerical values or percentages in your insights. Focus on qualitative analysis only.
      `

      try {
        console.log("Sending request to Gemini API for test analysis with prompt:", prompt)
        const response = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent",
          {
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
                maxOutputTokens: 2048,
              },
            }),
          },
        )

        if (!response.ok) {
          const errorData = await response.json()
          console.error("Gemini API error for test analysis:", errorData)
          data.aiInsights = `Gemini API Error: ${errorData.error || "Unknown error"}`
        } else {
          const result = await response.json()
          console.log("Gemini API raw response for test analysis:", JSON.stringify(result))

          if (
            result &&
            result.candidates &&
            result.candidates[0] &&
            result.candidates[0].content &&
            result.candidates[0].content.parts &&
            result.candidates[0].content.parts[0].text
          ) {
            let text = result.candidates[0].content.parts[0].text

            // Clean up any markdown formatting that might still be present
            text = text.replace(/#+\s/g, "") // Remove heading markers
            text = text.replace(/\*\*/g, "") // Remove bold markers
            text = text.replace(/\*/g, "") // Remove italic markers
            text = text.replace(/`/g, "") // Remove code markers
            text = text.replace(/```/g, "") // Remove code block markers

            // Remove any numerical percentages from the insights
            text = text.replace(/\d+%/g, "")
            text = text.replace(/\d+\.\d+%/g, "")

            data.aiInsights = text
          } else {
            console.warn("Gemini API response missing expected fields for test analysis")
            data.aiInsights = "Failed to generate AI insights due to unexpected API response."
          }
        }
      } catch (aiError) {
        console.error("Error generating AI insights for test analysis:", aiError)
        data.aiInsights = `Failed to generate AI insights: ${aiError instanceof Error ? aiError.message : "Unknown error"}`
      }
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Error in reports API:", error)
    return NextResponse.json({ error: "Failed to generate report" }, { status: 500 })
  }
}
