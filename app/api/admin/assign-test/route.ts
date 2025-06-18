import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const role = cookies().get("role")?.value

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { testId, assignmentType, userIds, dueDate } = await request.json()

    console.log("=== ASSIGN TEST API - START ===")
    console.log("Test ID:", testId)
    console.log("Assignment Type:", assignmentType)
    console.log("User IDs:", userIds)
    console.log("Due Date:", dueDate)

    if (!testId || !assignmentType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let targetUsers = []

    if (assignmentType === "all") {
      // Get all users with role "user"
      const { data: allUsers, error: usersError } = await supabaseServer.from("users").select("id").eq("role", "user")

      if (usersError) {
        console.error("Error fetching all users:", usersError)
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
      }

      targetUsers = allUsers || []
    } else if (assignmentType === "specific") {
      if (!userIds || userIds.length === 0) {
        return NextResponse.json({ error: "No users selected" }, { status: 400 })
      }

      // Validate that all provided user IDs exist and have role "user"
      const { data: specificUsers, error: specificUsersError } = await supabaseServer
        .from("users")
        .select("id")
        .in("id", userIds)
        .eq("role", "user")

      if (specificUsersError) {
        console.error("Error validating specific users:", specificUsersError)
        return NextResponse.json({ error: "Failed to validate users" }, { status: 500 })
      }

      targetUsers = specificUsers || []
    }

    console.log(`Found ${targetUsers.length} target users`)

    if (targetUsers.length === 0) {
      return NextResponse.json({ error: "No valid users found for assignment" }, { status: 400 })
    }

    // First, clear any existing assignments for this test to avoid duplicates
    const { error: deleteError } = await supabaseServer.from("user_tests").delete().eq("test_id", testId)

    if (deleteError) {
      console.error("Error clearing existing assignments:", deleteError)
      return NextResponse.json({ error: "Failed to clear existing assignments" }, { status: 500 })
    }

    // Create new assignments for the selected users
    const assignments = targetUsers.map((user) => ({
      user_id: user.id,
      test_id: testId,
      assigned_at: new Date().toISOString(),
      due_date: dueDate || null,
      status: "assigned",
    }))

    const { error: insertError } = await supabaseServer.from("user_tests").insert(assignments)

    if (insertError) {
      console.error("Error creating assignments:", insertError)
      return NextResponse.json({ error: "Failed to create assignments" }, { status: 500 })
    }

    // Update test status to published
    const { error: updateTestError } = await supabaseServer
      .from("tests")
      .update({
        status: "published",
        updated_at: new Date().toISOString(),
      })
      .eq("id", testId)

    if (updateTestError) {
      console.error("Error updating test status:", updateTestError)
      return NextResponse.json({ error: "Failed to update test status" }, { status: 500 })
    }

    console.log(`Successfully assigned test to ${targetUsers.length} users`)
    console.log("=== ASSIGN TEST API - SUCCESS ===")

    return NextResponse.json({
      success: true,
      assignedCount: targetUsers.length,
      message: `Test assigned to ${targetUsers.length} users successfully`,
    })
  } catch (error) {
    console.error("Error in assign test API:", error)
    console.log("=== ASSIGN TEST API - ERROR ===")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
