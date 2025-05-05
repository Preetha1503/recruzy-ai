import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const role = cookies().get("role")?.value

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const testId = params.id

    // Delete associated questions first
    const { error: questionsError } = await supabaseServer.from("questions").delete().eq("test_id", testId)

    if (questionsError) {
      console.error("Error deleting questions:", questionsError)
      return NextResponse.json({ error: "Failed to delete associated questions" }, { status: 500 })
    }

    // Delete the test
    const { error } = await supabaseServer.from("tests").delete().eq("id", testId)

    if (error) {
      console.error("Error deleting test:", error)
      return NextResponse.json({ error: "Failed to delete test" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in delete test API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
