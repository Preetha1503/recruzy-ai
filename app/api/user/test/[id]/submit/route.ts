import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const testId = params.id
    const body = await request.json()
    const { answers } = body

    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get test questions
    const { data: test } = await supabaseServer
      .from("tests")
      .select(`
        *,
        questions (id, correct_answer)
      `)
      .eq("id", testId)
      .single()

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    // Calculate score
    let correct = 0
    const total = test.questions.length

    test.questions.forEach((q: any) => {
      if (answers[q.id] === q.correct_answer) {
        correct++
      }
    })

    const score = Math.round((correct / total) * 100)

    // Save result
    const { data: result } = await supabaseServer
      .from("test_results")
      .insert({
        user_id: userId,
        test_id: testId,
        score,
        answers,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      resultId: result?.id,
      score: correct,
      totalQuestions: total,
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
