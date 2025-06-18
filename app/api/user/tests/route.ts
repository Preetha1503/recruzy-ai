import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    console.log("=== USER TESTS API - START ===")
    console.log("Requested User ID:", userId)

    if (!userId) {
      console.log("No userId provided in query params")
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

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
        tests!inner (
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
      .eq("tests.status", "published")

    if (userTestsError) {
      console.error("Error fetching user tests:", userTestsError)
      return NextResponse.json(
        {
          error: `Database error: ${userTestsError.message}`,
          details: userTestsError,
        },
        { status: 500 },
      )
    }

    console.log(`Found ${userTests?.length || 0} user test assignments`)

    // Transform the data to match expected format
    const assignedTests = (userTests || [])
      .filter((ut) => ut.tests) // Filter out any null tests
      .map((ut) => ({
        ...ut.tests,
        due_date: ut.due_date,
        user_test_id: ut.id,
        assigned_at: ut.assigned_at,
        assignment_status: ut.status,
      }))

    console.log(`Returning ${assignedTests.length} assigned tests`)
    console.log("=== USER TESTS API - SUCCESS ===")

    return NextResponse.json({
      assignedTests,
      publishedTests: [], // No longer returning unassigned published tests
    })
  } catch (error) {
    console.error("Error in user tests API:", error)
    console.log("=== USER TESTS API - ERROR ===")
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    )
  }
}
