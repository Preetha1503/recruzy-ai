import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import type { NextRequest } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { userId, testId } = await request.json()

    if (!userId || !testId) {
      return NextResponse.json({ error: "User ID and Test ID are required" }, { status: 400 })
    }

    console.log(`Starting test ${testId} for user ${userId}`)

    // First check if the test exists and is available
    const { data: test, error: testError } = await supabaseServer.from("tests").select("*").eq("id", testId).single()

    if (testError) {
      console.error("Error fetching test:", testError)
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    if (test.status !== "active" && test.status !== "published") {
      return NextResponse.json({ error: "This test is not currently available" }, { status: 403 })
    }

    // Check if the test is already assigned to the user
    const { data: existingAssignment, error: checkError } = await supabaseServer
      .from("user_tests")
      .select("id, status")
      .eq("user_id", userId)
      .eq("test_id", testId)
      .single()

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is the error code for "no rows returned"
      console.error("Error checking existing assignment:", checkError)
      return NextResponse.json({ error: "Failed to check test assignment" }, { status: 500 })
    }

    // If the test is not already assigned, assign it
    if (!existingAssignment) {
      console.log(`Assigning test ${testId} to user ${userId}`)
      const { error: assignError } = await supabaseServer.from("user_tests").insert([
        {
          user_id: userId,
          test_id: testId,
          assigned_at: new Date().toISOString(),
          status: "started",
        },
      ])

      if (assignError) {
        console.error("Error assigning test:", assignError)
        return NextResponse.json({ error: "Failed to assign test" }, { status: 500 })
      }
    } else if (existingAssignment.status === "assigned") {
      // Update the status to "started"
      console.log(`Updating test ${testId} status to started for user ${userId}`)
      const { error: updateError } = await supabaseServer
        .from("user_tests")
        .update({ status: "started" })
        .eq("id", existingAssignment.id)

      if (updateError) {
        console.error("Error updating test status:", updateError)
        return NextResponse.json({ error: "Failed to update test status" }, { status: 500 })
      }
    } else if (existingAssignment.status === "completed") {
      // Allow retaking completed tests
      console.log(`User ${userId} is retaking completed test ${testId}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error starting test:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
