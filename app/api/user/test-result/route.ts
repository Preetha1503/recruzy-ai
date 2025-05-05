import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const userIdCookie = cookieStore.get("user_id")
    const userId = userIdCookie?.value

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const resultId = searchParams.get("resultId")

    if (!resultId) {
      return NextResponse.json({ error: "Result ID is required" }, { status: 400 })
    }

    console.log(`Fetching test result with ID: ${resultId} for user: ${userId}`)

    // Fetch the test result
    const { data: result, error: resultError } = await supabaseServer
      .from("test_results")
      .select("*, tests(title, topic, description, duration)")
      .eq("id", resultId)
      .single()

    if (resultError) {
      console.error("Error fetching test result:", resultError)
      return NextResponse.json({ error: `Failed to fetch test result: ${resultError.message}` }, { status: 500 })
    }

    if (!result) {
      console.error("Test result not found for ID:", resultId)
      return NextResponse.json({ error: "Test result not found" }, { status: 404 })
    }

    // Check if the user is authorized to view this result
    if (result.user_id !== userId) {
      // Check if the user is an admin
      const { data: user, error: userError } = await supabaseServer
        .from("users")
        .select("role")
        .eq("id", userId)
        .single()

      if (userError) {
        console.error("Error fetching user role:", userError)
        return NextResponse.json({ error: `Error checking authorization: ${userError.message}` }, { status: 500 })
      }

      if (!user || user.role !== "admin") {
        console.error("User not authorized to view this result:", userId)
        return NextResponse.json({ error: "Not authorized to view this result" }, { status: 403 })
      }
    }

    // Fetch the questions for this test
    const { data: questions, error: questionsError } = await supabaseServer
      .from("questions")
      .select("id, text, options, correct_answer, explanation")
      .eq("test_id", result.test_id)

    if (questionsError) {
      console.error("Error fetching questions:", questionsError)
      return NextResponse.json({ error: `Failed to fetch questions: ${questionsError.message}` }, { status: 500 })
    }

    // Ensure all required fields exist with default values if missing
    const processedResult = {
      ...result,
      tab_switch_attempts: result.tab_switch_attempts || 0,
      no_face_violations: result.no_face_violations || 0,
      multiple_faces_violations: result.multiple_faces_violations || 0,
      face_changed_violations: result.face_changed_violations || 0,
      error_count: result.error_count || 0,
      client_errors: result.client_errors || [],
      answers: result.answers || {},
      time_taken: result.time_taken || 0,
    }

    // Return the result with questions
    return NextResponse.json({
      result: {
        ...processedResult,
        questions: questions || [],
      },
    })
  } catch (error) {
    console.error("Error in test result API:", error)
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
