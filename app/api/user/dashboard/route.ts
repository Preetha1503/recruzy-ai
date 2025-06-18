import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    // Get userId from query params or cookies (matching existing pattern)
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId") || cookies().get("user_id")?.value

    if (!userId) {
      console.error("User ID not found in request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`=== USER DASHBOARD API - START ===`)
    console.log(`Fetching dashboard data for user: ${userId}`)

    // Get tests assigned to this specific user through user_tests table
    const { data: userTests, error: userTestsError } = await supabaseServer
      .from("user_tests")
      .select(`
        id,
        test_id,
        user_id,
        status,
        assigned_at,
        due_date,
        tests (
          id,
          title,
          description,
          topic,
          duration,
          status,
          created_at
        )
      `)
      .eq("user_id", userId)
      .eq("status", "assigned")

    if (userTestsError) {
      console.error("Error fetching user tests:", userTestsError)
      return NextResponse.json({
        activeTests: [],
        recentResults: [],
        testsCompleted: 0,
        averageScore: 0,
        activeTestsCount: 0,
      })
    }

    console.log(`Found ${userTests?.length || 0} user test assignments`)

    // Filter to only include published tests and transform data
    const assignedTests = (userTests || [])
      .filter((ut) => ut.tests && ut.tests.status === "published")
      .map((ut) => ({
        ...ut.tests,
        assignment_status: ut.status,
        assigned_at: ut.assigned_at,
        due_date: ut.due_date,
      }))

    console.log(`Found ${assignedTests.length} published assigned tests`)

    // Get user's test results
    const { data: testResults, error: resultsError } = await supabaseServer
      .from("test_results")
      .select(`
        id,
        test_id,
        score,
        time_taken,
        completed_at,
        tests (
          title,
          topic
        )
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (resultsError) {
      console.error("Error fetching test results:", resultsError)
      // Continue with empty results rather than failing
    }

    const results = testResults || []
    console.log(`Found ${results.length} test results for user`)

    // Calculate stats
    const testsCompleted = results.length
    const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0)
    const averageScore = testsCompleted > 0 ? Math.round(totalScore / testsCompleted) : 0

    // Get recent results (limit to 3)
    const recentResults = results.slice(0, 3)

    console.log(`=== USER DASHBOARD API - SUCCESS ===`)
    console.log(`Active tests: ${assignedTests.length}`)
    console.log(`Tests completed: ${testsCompleted}`)
    console.log(`Average score: ${averageScore}%`)

    return NextResponse.json({
      activeTests: assignedTests,
      recentResults,
      testsCompleted,
      averageScore,
      activeTestsCount: assignedTests.length,
    })
  } catch (error) {
    console.error("Error in user dashboard API:", error)
    console.log("=== USER DASHBOARD API - ERROR ===")
    return NextResponse.json(
      {
        error: "Failed to fetch dashboard data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
