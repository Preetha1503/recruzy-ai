import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"
import { getAllTests } from "@/lib/db/secure-test-operations"
import type { NextRequest } from "next/server"

// Update the GET function to support status filtering and include more detailed logging
export async function GET(request: NextRequest) {
  try {
    console.log("API: Tests endpoint called")

    // Check if user is admin
    const role = cookies().get("role")?.value
    console.log("API: User role:", role)

    if (role !== "admin") {
      console.log("API: Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Get status from query params
    const { searchParams } = request.nextUrl
    const status = searchParams.get("status")

    console.log(`API: Fetching tests with status filter: ${status || "none"}`)

    // Use the secure operation to bypass RLS
    let tests = await getAllTests()
    console.log(`API: Retrieved ${tests.length} tests from database`)

    // Filter by status if provided
    if (status && status !== "all") {
      tests = tests.filter((test) => test.status === status)
      console.log(`API: Filtered to ${tests.length} tests with status: ${status}`)
    }

    // For each test, get the question count
    console.log("API: Getting question counts for each test")
    const testsWithQuestionCount = await Promise.all(
      tests.map(async (test) => {
        const { count } = await supabaseServer
          .from("questions")
          .select("*", { count: "exact", head: true })
          .eq("test_id", test.id)

        return {
          ...test,
          questions: { count: count || 0 },
        }
      }),
    )

    console.log(`API: Returning ${testsWithQuestionCount.length} tests with question counts`)
    return NextResponse.json(testsWithQuestionCount)
  } catch (error) {
    console.error("Error in tests API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
