import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const testId = searchParams.get("id")
    const userId = cookies().get("userId")?.value
    const role = cookies().get("role")?.value

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!testId) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 })
    }

    console.log("=== USER TEST ACCESS API - START ===")
    console.log("User ID:", userId)
    console.log("Test ID:", testId)

    // First, check if the user is assigned to this test
    const { data: userTest, error: assignmentError } = await supabaseServer
      .from("user_tests")
      .select("*")
      .eq("user_id", userId)
      .eq("test_id", testId)
      .single()

    if (assignmentError || !userTest) {
      console.log("User not assigned to this test")
      return NextResponse.json(
        {
          error: "You are not assigned to this test",
        },
        { status: 403 },
      )
    }

    // Get the test details
    const { data: test, error: testError } = await supabaseServer
      .from("tests")
      .select("*")
      .eq("id", testId)
      .eq("status", "published")
      .single()

    if (testError || !test) {
      console.error("Error fetching test:", testError)
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    // Get questions for the test
    const { data: questions, error: questionsError } = await supabaseServer
      .from("questions")
      .select("id, text, options, difficulty")
      .eq("test_id", testId)
      .order("created_at")

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      return NextResponse.json({ error: "Failed to fetch questions" }, { status: 500 })
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

    console.log(`User has access to test with ${questions?.length || 0} questions`)
    console.log("=== USER TEST ACCESS API - SUCCESS ===")

    return NextResponse.json({
      test: {
        ...test,
        assignment_status: userTest.status,
        assigned_at: userTest.assigned_at,
        due_date: userTest.due_date,
      },
      questions: questions || [],
    })
  } catch (error) {
    console.error("Error in user test API:", error)
    console.log("=== USER TEST ACCESS API - ERROR ===")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
