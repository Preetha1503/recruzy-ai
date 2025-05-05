import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    const { userId, testIds } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    console.log(`Fixing test assignments for user ${userId}`)

    // If specific test IDs were provided, use those
    let publishedTests = []
    if (testIds && Array.isArray(testIds) && testIds.length > 0) {
      console.log(`Using provided test IDs: ${testIds.join(", ")}`)
      publishedTests = testIds.map((id) => ({ id }))
    } else {
      // Otherwise, get all published tests
      console.log("Fetching all published tests")
      const { data, error } = await supabaseServer.from("tests").select("id, title").eq("status", "published")

      if (error) {
        console.error("Error fetching published tests:", error)
        return NextResponse.json({ error: "Failed to fetch published tests" }, { status: 500 })
      }

      publishedTests = data || []
      console.log(`Found ${publishedTests.length} published tests`)
      publishedTests.forEach((test) => console.log(`- ${test.title} (${test.id})`))
    }

    if (publishedTests.length === 0) {
      return NextResponse.json({ message: "No published tests found to assign" })
    }

    // Get user's existing test assignments
    const { data: existingAssignments, error: assignmentsError } = await supabaseServer
      .from("user_tests")
      .select("test_id, status")
      .eq("user_id", userId)

    if (assignmentsError) {
      console.error("Error fetching existing assignments:", assignmentsError)
      return NextResponse.json({ error: "Failed to fetch existing assignments" }, { status: 500 })
    }

    console.log(`User has ${existingAssignments?.length || 0} existing assignments`)

    // Find tests that aren't already assigned
    const existingTestIds = (existingAssignments || []).map((a) => a.test_id)
    const testsToAssign = publishedTests.filter((test) => !existingTestIds.includes(test.id))

    console.log(`Found ${testsToAssign.length} tests to assign to user ${userId}`)
    testsToAssign.forEach((test) => console.log(`- Assigning: ${test.title || test.id}`))

    if (testsToAssign.length === 0) {
      return NextResponse.json({ message: "User already has all published tests assigned" })
    }

    // Create assignments for missing tests
    const assignments = testsToAssign.map((test) => ({
      user_id: userId,
      test_id: test.id,
      assigned_at: new Date().toISOString(),
      status: "assigned",
    }))

    const { error: insertError } = await supabaseServer.from("user_tests").insert(assignments)

    if (insertError) {
      console.error("Error creating assignments:", insertError)
      return NextResponse.json({ error: "Failed to create assignments" }, { status: 500 })
    }

    console.log(`Successfully assigned ${assignments.length} tests to user ${userId}`)
    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignments.length} tests to user`,
      assignedTests: assignments.length,
    })
  } catch (error) {
    console.error("Error fixing assignments:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
