import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const testId = params.id
    const { answers, violations, timeSpent } = await request.json()
    const supabase = createServerClient()

    // Get user credentials from cookies
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const role = cookieStore.get("role")?.value

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get the test with questions to calculate score
    const { data: test, error: testError } = await supabase
      .from("tests")
      .select(`
        *,
        questions (
          id,
          correct_answer
        )
      `)
      .eq("id", testId)
      .single()

    if (testError || !test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    // Calculate score
    let correctAnswers = 0
    const totalQuestions = test.questions.length

    test.questions.forEach((question: any) => {
      if (answers[question.id] === question.correct_answer) {
        correctAnswers++
      }
    })

    const score = Math.round((correctAnswers / totalQuestions) * 100)

    // Insert test result
    const { data: resultData, error: resultError } = await supabase
      .from("test_results")
      .insert({
        user_id: userId,
        test_id: testId,
        score,
        answers,
        time_taken: timeSpent,
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        tab_switch_attempts: violations?.tabSwitches || 0,
        no_face_violations: violations?.noFace || 0,
        multiple_faces_violations: violations?.multipleFaces || 0,
        face_changed_violations: violations?.faceChanged || 0,
      })
      .select()
      .single()

    if (resultError) {
      console.error("Error inserting test result:", resultError)
      return NextResponse.json({ error: "Failed to save test result" }, { status: 500 })
    }

    // Update user_tests status to completed
    const { error: updateError } = await supabase
      .from("user_tests")
      .update({ status: "completed" })
      .eq("user_id", userId)
      .eq("test_id", testId)

    if (updateError) {
      console.error("Error updating user_test status:", updateError)
    }

    return NextResponse.json({
      success: true,
      resultId: resultData.id,
      score: correctAnswers,
      totalQuestions,
    })
  } catch (error) {
    console.error("Error submitting test:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
