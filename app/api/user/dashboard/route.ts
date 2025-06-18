import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getActiveTestsForUser } from "@/lib/db/secure-user-test-operations"
import { getTestResultsByUserId } from "@/lib/db/secure-result-operations"

export async function GET(request: Request) {
  try {
    // Get userId from query params or cookies
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId") || cookies().get("user_id")?.value

    if (!userId) {
      console.error("User ID not found in request")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log(`Fetching dashboard data for user: ${userId}`)

    // Get active tests for the user with improved error handling
    try {
      const userTests = await getActiveTestsForUser(userId)
      console.log(`Found ${userTests.length} active tests for user`)

      // Extract the tests from the user_tests data
      const activeTests = userTests
        .filter((test) => test.tests)
        .map((userTest) => ({
          ...userTest.tests,
          due_date: userTest.due_date,
        }))

      console.log(`Processed ${activeTests.length} active tests`)

      // Get test results for the user
      const results = await getTestResultsByUserId(userId)
      console.log(`Found ${results.length} test results for user`)

      // Get total active tests count
      const activeTestsCount = userTests.length

      // Calculate stats
      const testsCompleted = results.length
      const totalScore = results.reduce((sum, result) => sum + (result.score || 0), 0)
      const averageScore = testsCompleted > 0 ? Math.round(totalScore / testsCompleted) : 0

      // Get recent results (limit to 2)
      const recentResults = results.slice(0, 2)

      return NextResponse.json({
        activeTests,
        recentResults,
        testsCompleted,
        averageScore,
        activeTestsCount,
      })
    } catch (error) {
      console.error("Error processing user data:", error)
      return NextResponse.json({
        activeTests: [],
        recentResults: [],
        testsCompleted: 0,
        averageScore: 0,
        activeTestsCount: 0,
      })
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 })
  }
}
