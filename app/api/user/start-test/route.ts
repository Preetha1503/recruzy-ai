import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { testId } = await request.json()
    const userId = cookies().get("userId")?.value
    const role = cookies().get("role")?.value

    if (!userId || role !== "user") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    if (!testId) {
      return NextResponse.json({ error: "Test ID is required" }, { status: 400 })
    }

    console.log("=== START TEST API - START ===")
    console.log("User ID:", userId)
    console.log("Test ID:", testId)

    // Check if user is assigned to this test
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

    // Check if test exists and is published
    const { data: test, error: testError } = await supabaseServer
      .from("tests")
      .select("*")
      .eq("id", testId)
      .eq("status", "published")
      .single()

    if (testError || !test) {
      return NextResponse.json({ error: "Test not found or not available" }, { status: 404 })
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

    // Update user_test status to in_progress
    const { error: updateError } = await supabaseServer
      .from("user_tests")
      .update({ status: "in_progress" })
      .eq("user_id", userId)
      .eq("test_id", testId)

    if (updateError) {
      console.error("Error updating test status:", updateError)
      return NextResponse.json({ error: "Failed to start test" }, { status: 500 })
    }

    console.log("Test started successfully")
    console.log("=== START TEST API - SUCCESS ===")

    return NextResponse.json({
      success: true,
      message: "Test started successfully",
    })
  } catch (error) {
    console.error("Error in start test API:", error)
    console.log("=== START TEST API - ERROR ===")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
