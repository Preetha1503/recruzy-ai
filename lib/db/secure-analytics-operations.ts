import { supabaseServer } from "@/lib/supabase/server"
import type { UserAnalytics } from "@/lib/types"

/**
 * Get user performance data, bypassing RLS
 */
export async function getUserPerformanceData(userId: string): Promise<UserAnalytics | { error: string }> {
  try {
    console.log(`Getting performance data for user: ${userId}`)

    // Fetch test results for the user
    const { data: testResults, error: resultsError } = await supabaseServer
      .from("test_results")
      .select(`
        id,
        score,
        answers,
        time_taken,
        started_at,
        completed_at,
        test_id,
        tests (
          id,
          title,
          topic,
          duration
        )
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (resultsError) {
      console.error("Error fetching test results:", resultsError)
      return { error: "Failed to fetch test results" }
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

    return {
      topicPerformance: topicPerformance,
      testResults: testResults || [],
    }
  } catch (error) {
    console.error("Error in getUserAnalytics:", error)
    return { error: "An unexpected error occurred" }
  }
}
