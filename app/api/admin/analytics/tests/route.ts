import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { getRoleFromServerCookies } from "@/lib/server-utils"

export async function GET() {
  try {
    // Check if user is admin
    const role = getRoleFromServerCookies()

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("Fetching test analytics data...")

    // Fetch all tests with detailed analytics
    const { data: tests, error: testsError } = await supabaseServer
      .from("tests")
      .select("id, title, topic, duration, created_at")

    if (testsError) {
      console.error("Error fetching tests:", testsError)
      return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 })
    }

    // For each test, get completion data
    const testsWithAnalytics = await Promise.all(
      tests.map(async (test) => {
        // Get assigned count
        const { count: assignedCount, error: assignedError } = await supabaseServer
          .from("user_tests")
          .select("*", { count: "exact", head: true })
          .eq("test_id", test.id)

        if (assignedError) {
          console.error(`Error fetching assigned count for test ${test.id}:`, assignedError)
          return {
            ...test,
            total_assigned: 0,
            total_completed: 0,
            completion_rate: 0,
            avg_score: 0,
          }
        }

        // Get completed count and average score
        const { data: results, error: resultsError } = await supabaseServer
          .from("test_results")
          .select("score")
          .eq("test_id", test.id)

        if (resultsError) {
          console.error(`Error fetching results for test ${test.id}:`, resultsError)
          return {
            ...test,
            total_assigned: assignedCount || 0,
            total_completed: 0,
            completion_rate: 0,
            avg_score: 0,
          }
        }

        const completedCount = results.length
        const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0)
        const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0
        const completionRate = assignedCount > 0 ? completedCount / assignedCount : 0

        return {
          ...test,
          total_assigned: assignedCount || 0,
          total_completed: completedCount,
          completion_rate: completionRate,
          avg_score: avgScore,
        }
      }),
    )

    // Get total tests count
    const { count: totalTests, error: countError } = await supabaseServer
      .from("tests")
      .select("*", { count: "exact", head: true })

    if (countError) {
      console.error("Error fetching total tests count:", countError)
    }

    console.log(`Returning analytics for ${testsWithAnalytics.length} tests`)

    return NextResponse.json({
      data: {
        totalTests: totalTests || 0,
        tests: testsWithAnalytics,
      },
    })
  } catch (error) {
    console.error("Error in tests analytics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
