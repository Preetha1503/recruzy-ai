import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Debug: Fetching test info for user ${userId}`)

    // Get user details
    const { data: user, error: userError } = await supabaseServer.from("users").select("*").eq("id", userId).single()

    if (userError) {
      console.error("Error fetching user:", userError)
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // Get all published tests
    const { data: publishedTests, error: publishedError } = await supabaseServer
      .from("tests")
      .select("id, title, topic, status, created_at")
      .eq("status", "published")

    if (publishedError) {
      console.error("Error fetching published tests:", publishedError)
      return NextResponse.json({ error: "Error fetching published tests" }, { status: 500 })
    }

    console.log(`Debug: Found ${publishedTests?.length || 0} published tests`)

    // Get user's assigned tests
    const { data: userTests, error: userTestsError } = await supabaseServer
      .from("user_tests")
      .select(`
       id, 
       test_id,
       status,
       assigned_at,
       due_date,
       tests (
         id,
         title,
         topic,
         status
       )
     `)
      .eq("user_id", userId)

    if (userTestsError) {
      console.error("Error fetching user tests:", userTestsError)
      return NextResponse.json({ error: "Error fetching user tests" }, { status: 500 })
    }

    console.log(`Debug: Found ${userTests?.length || 0} assigned tests for user`)

    // Check if there are published tests that aren't assigned to the user
    const assignedTestIds = userTests.map((ut) => ut.test_id)
    const unassignedPublishedTests = publishedTests.filter((pt) => !assignedTestIds.includes(pt.id))

    console.log(`Debug: Found ${unassignedPublishedTests.length} unassigned published tests`)
    if (unassignedPublishedTests.length > 0) {
      console.log(
        "Unassigned tests:",
        unassignedPublishedTests.map((t) => `${t.title} (${t.id})`),
      )
    }

    // Return all the data for debugging
    return NextResponse.json({
      user,
      publishedTests,
      userTests,
      unassignedPublishedTests,
      diagnostics: {
        totalPublishedTests: publishedTests.length,
        totalAssignedTests: userTests.length,
        missingAssignments: unassignedPublishedTests.length,
      },
    })
  } catch (error) {
    console.error("Debug endpoint error:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
