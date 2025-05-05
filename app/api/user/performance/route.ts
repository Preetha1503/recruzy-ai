import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    // Get userId from query params or cookies
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || cookies().get("user_id")?.value

    if (!userId) {
      console.error("User ID not found in request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`API: Fetching performance data for user: ${userId}`)

    // Fetch test results for the user
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
      return NextResponse.json({ error: "Failed to fetch test results" }, { status: 500 })
    }

    console.log(`Found ${testResults?.length || 0} test results for user ${userId}`)

    // Calculate average score
    let averageScore = 0
    if (testResults && testResults.length > 0) {
      const totalScore = testResults.reduce((sum, result) => sum + (result.score || 0), 0)
      averageScore = Math.round(totalScore / testResults.length)
    }

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

    // Calculate skill gaps (topics with lowest scores)
    const skillGaps = [...Object.entries(topicScores)]
      .filter(([_, data]) => data.scores.length > 0)
      .map(([topic, data]) => {
        const avgScore = Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length)
        return {
          skill: topic,
          score: 100 - avgScore, // Gap is the inverse of the score
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    // Calculate strengths (topics with highest scores)
    const strengths = [...Object.entries(topicScores)]
      .filter(([_, data]) => data.scores.length > 0)
      .map(([topic, data]) => {
        const avgScore = Math.round(data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length)
        return {
          skill: topic,
          score: avgScore,
        }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)

    // Get recent scores
    const recentScores = testResults
      ? testResults.slice(0, 5).map((result) => ({
          testId: result.test_id,
          testTitle: result.tests?.title || "Unknown Test",
          score: result.score,
          date: result.completed_at,
        }))
      : []

    console.log("API: Performance data processed:", {
      topicPerformanceCount: topicPerformance.length,
      testResultsCount: testResults?.length || 0,
      skillGapsCount: skillGaps.length,
      strengthsCount: strengths.length,
    })

    return NextResponse.json({
      topicPerformance,
      recentScores,
      averageScore,
      testsCompleted: testResults?.length || 0,
      skillGaps,
      strengths,
    })
  } catch (error) {
    console.error("API: Error fetching performance data:", error)
    return NextResponse.json({ error: "Failed to fetch performance data" }, { status: 500 })
  }
}
