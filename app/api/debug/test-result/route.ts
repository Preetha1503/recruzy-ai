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

    // Check if user is admin
    const { data: user, error: userError } = await supabaseServer.from("users").select("role").eq("id", userId).single()

    if (userError || !user || user.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const resultId = searchParams.get("resultId")

    if (!resultId) {
      return NextResponse.json({ error: "Result ID is required" }, { status: 400 })
    }

    // Fetch the test result with all fields
    const { data: result, error: resultError } = await supabaseServer
      .from("test_results")
      .select("*")
      .eq("id", resultId)
      .single()

    if (resultError) {
      return NextResponse.json({ error: `Failed to fetch test result: ${resultError.message}` }, { status: 500 })
    }

    if (!result) {
      return NextResponse.json({ error: "Test result not found" }, { status: 404 })
    }

    // Fetch the test
    const { data: test, error: testError } = await supabaseServer
      .from("tests")
      .select("*")
      .eq("id", result.test_id)
      .single()

    if (testError) {
      return NextResponse.json(
        {
          error: `Failed to fetch test: ${testError.message}`,
          result,
        },
        { status: 500 },
      )
    }

    // Fetch the questions
    const { data: questions, error: questionsError } = await supabaseServer
      .from("questions")
      .select("*")
      .eq("test_id", result.test_id)

    if (questionsError) {
      return NextResponse.json(
        {
          error: `Failed to fetch questions: ${questionsError.message}`,
          result,
          test,
        },
        { status: 500 },
      )
    }

    // Return all data for debugging
    return NextResponse.json({
      result,
      test,
      questions,
      cookies: {
        userId: userIdCookie?.value,
      },
    })
  } catch (error) {
    console.error("Error in debug test result API:", error)
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred"
    return NextResponse.json({ error: errorMessage }, { status: 500 })
  }
}
