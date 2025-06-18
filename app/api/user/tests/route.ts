import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`API: Fetching tests for user: ${userId}`)

    // Get tests assigned to the user
    const assignedTests = await getAssignedTests(userId)
    console.log(`API: Found ${assignedTests.length} assigned tests for user ${userId}`)

    return NextResponse.json({
      assignedTests,
      publishedTests: [], // We're not using this anymore since all published tests should be assigned
    })
  } catch (error) {
    console.error("Error fetching tests:", error)
    return NextResponse.json({ error: "Failed to fetch tests" }, { status: 500 })
  }
}

async function getAssignedTests(userId: string) {
  try {
    // Get tests assigned to the user through user_tests table
    const { data: userTests, error: userTestsError } = await supabaseServer
      .from("user_tests")
      .select(`
      id,
      test_id,
      due_date,
      status,
      tests (*)
    `)
      .eq("user_id", userId)
      .eq("status", "assigned")
      .order("due_date", { ascending: true })

    if (userTestsError) {
      console.error("Error fetching user tests:", userTestsError)
      return []
    }

    console.log(`API: Raw user tests data: found ${userTests?.length || 0} records`)

    // Log any tests with missing data
    const testsWithMissingData = userTests.filter((ut) => !ut.tests)
    if (testsWithMissingData.length > 0) {
      console.error(`API: Found ${testsWithMissingData.length} tests with missing data`)
      testsWithMissingData.forEach((ut) => console.error(`- Missing test data for test_id: ${ut.test_id}`))
    }

    // Transform the data to match the expected format
    const formattedTests = userTests
      .filter((userTest) => userTest.tests) // Filter out any null tests
      .map((userTest) => ({
        ...userTest.tests,
        due_date: userTest.due_date,
        user_test_id: userTest.id,
      }))

    console.log(`API: After formatting, returning ${formattedTests.length} tests`)

    return formattedTests
  } catch (error) {
    console.error("Error in getAssignedTests:", error)
    return []
  }
}
