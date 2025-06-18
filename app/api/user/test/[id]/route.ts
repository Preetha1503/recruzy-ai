import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const testId = params.id
    const cookieStore = cookies()
    const userId = cookieStore.get("user_id")?.value
    const role = cookieStore.get("role")?.value

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check assignment
    const { data: userTest } = await supabaseServer
      .from("user_tests")
      .select("*")
      .eq("user_id", userId)
      .eq("test_id", testId)
      .single()

    if (!userTest) {
      return NextResponse.json({ error: "Not assigned" }, { status: 403 })
    }

    // Get test
    const { data: test } = await supabaseServer
      .from("tests")
      .select(`
        *,
        questions (*)
      `)
      .eq("id", testId)
      .single()

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    return NextResponse.json({
      test,
      questions: test.questions || [],
    })
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}
