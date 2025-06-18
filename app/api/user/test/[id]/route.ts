import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const testId = params.id

    // Get user credentials from cookies
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const userEmail = cookieStore.get("user_email")?.value
    const role = cookieStore.get("role")?.value

    console.log("=== USER TEST ACCESS API - START ===")
    console.log("User ID from cookies:", userId)
    console.log("Role from cookies:", role)
    console.log("Test ID:", testId)

    if (!userId || role !== "user") {
      console.log("Authentication failed - userId:", userId, "role:", role)
      return NextResponse.json({ error: "Unauthorized - Please log in again" }, { status: 401 })
    }

    if (!testId) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 })
    }

    // First, check if the user is assigned to this test
    const { data: userTest, error: assignmentError } = await supabaseServer
      .from("user_tests")
      .select("*")
      .eq("user_id", userId)
      .eq("test_id", testId)
      .single()

    if (assignmentError || !userTest) {
      console.log("User not assigned to this test:", assignmentError)
      return NextResponse.json(
        {
          error: "You are not assigned to this test",
        },
        { status: 403 },
      )
    }

    // Get the test details with questions
    const { data: test, error: testError } = await supabaseServer
      .from("tests")
      .select(`
        *,
        questions (
          id,
          text,
          type,
          options,
          difficulty,
          code_snippet,
          programming_language,
          expected_output,
          error_line
        )
      `)
      .eq("id", testId)
      .eq("status", "published")
      .single()

    if (testError || !test) {
      console.error("Error fetching test:", testError)
      return NextResponse.json({ error: "Test not found or not published" }, { status: 404 })
    }

    // Check if user has already completed this test
    const { data: existingResult, error: resultError } = await supabaseServer
      .from("test_results")
      .select("id")
      .eq("user_id", userId)
      .eq("test_id", testId)
      .single()

    if (existingResult) {
      return NextResponse.json(
        {
          error: "You have already completed this test",
        },
        { status: 400 },
      )
    }

    console.log(`User has access to test with ${test.questions?.length || 0} questions`)
    console.log("=== USER TEST ACCESS API - SUCCESS ===")

    return NextResponse.json({
      test: {
        ...test,
        assignment_status: userTest.status,
        assigned_at: userTest.assigned_at,
        due_date: userTest.due_date,
      },
      questions: test.questions || [],
      userEmail: userEmail || "user@example.com",
    })
  } catch (error) {
    console.error("Error in user test API:", error)
    console.log("=== USER TEST ACCESS API - ERROR ===")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
