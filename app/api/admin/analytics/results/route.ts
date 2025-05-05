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

    console.log("Fetching test results analytics data...")

    // First, let's check the structure of the test_results table
    const { data: tableInfo, error: tableError } = await supabaseServer.rpc("get_table_columns", {
      table_name: "test_results",
    })

    if (tableError) {
      console.error("Error fetching table structure:", tableError)
      // Continue anyway, we'll use a simplified query
    } else {
      console.log("Table columns:", tableInfo)
    }

    // Use a simplified query first to get basic results data
    const { data: testResults, error: testResultsError } = await supabaseServer
      .from("test_results")
      .select(`
        id,
        user_id,
        test_id,
        score,
        time_taken,
        completed_at
      `)
      .order("completed_at", { ascending: false })
      .limit(100)

    if (testResultsError) {
      console.error("Error fetching test results:", testResultsError)
      return NextResponse.json({ error: "Failed to fetch test results" }, { status: 500 })
    }

    console.log(`Retrieved ${testResults.length} test results`)

    // Get user and test details separately
    const userIds = [...new Set(testResults.map((result) => result.user_id))]
    const testIds = [...new Set(testResults.map((result) => result.test_id))]

    // Fetch users
    const { data: users, error: usersError } = await supabaseServer
      .from("users")
      .select("id, username, email")
      .in("id", userIds)

    if (usersError) {
      console.error("Error fetching users:", usersError)
    }

    // Fetch tests
    const { data: tests, error: testsError } = await supabaseServer
      .from("tests")
      .select("id, title, topic")
      .in("id", testIds)

    if (testsError) {
      console.error("Error fetching tests:", testsError)
    }

    // Create lookup maps
    const userMap = users
      ? users.reduce((map, user) => {
          map[user.id] = user
          return map
        }, {})
      : {}

    const testMap = tests
      ? tests.reduce((map, test) => {
          map[test.id] = test
          return map
        }, {})
      : {}

    // Process results
    const processedResults = testResults.map((result) => {
      const user = userMap[result.user_id] || {}
      const test = testMap[result.test_id] || {}

      return {
        id: result.id,
        user_id: result.user_id,
        test_id: result.test_id,
        score: result.score || 0,
        time_taken: result.time_taken || 0,
        completed_at: result.completed_at,
        username: user.username || "Unknown",
        email: user.email || "Unknown",
        test_title: test.title || "Unknown",
        test_topic: test.topic || "Unknown",
        // Default values for proctoring data
        tab_switch_attempts: 0,
        no_face_violations: 0,
        multiple_faces_violations: 0,
        client_errors: 0,
      }
    })

    // Calculate summary statistics
    const completedTests = processedResults.length
    const totalScore = processedResults.reduce((sum, result) => sum + result.score, 0)
    const averageScore = completedTests > 0 ? Math.round(totalScore / completedTests) : 0

    console.log("Test results analytics data:", {
      completedTests,
      averageScore,
      sampleResult: processedResults.length > 0 ? processedResults[0] : null,
    })

    return NextResponse.json({
      data: {
        completedTests,
        averageScore,
        results: processedResults,
      },
    })
  } catch (error) {
    console.error("Error in results analytics API:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 },
    )
  }
}
