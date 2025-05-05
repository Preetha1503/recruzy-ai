import { NextResponse } from "next/server"
import { getTestWithQuestions } from "@/lib/db/secure-test-operations"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const testId = searchParams.get("testId")

    if (!testId) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 })
    }

    // Get the test with questions using the secure operation that bypasses RLS
    const test = await getTestWithQuestions(testId)

    if (!test) {
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    return NextResponse.json({ test })
  } catch (error) {
    console.error("Error fetching test:", error)
    return NextResponse.json({ error: "Failed to fetch test" }, { status: 500 })
  }
}
