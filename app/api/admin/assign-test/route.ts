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

    // Get existing assignments for this test to preserve them
    const { data: existingAssignments, error: existingError } = await supabaseServer
      .from("user_tests")
      .select("user_id")
      .eq("test_id", testId)

    if (existingError) {
      console.error("Error fetching existing assignments:", existingError)
      return NextResponse.json({ error: "Failed to fetch existing assignments" }, { status: 500 })
    }

    const existingUserIds = (existingAssignments || []).map((a) => a.user_id)
    const newUserIds = targetUsers.map((u) => u.id).filter((id) => !existingUserIds.includes(id))

    console.log(`Existing assignments: ${existingUserIds.length}`)
    console.log(`New assignments to create: ${newUserIds.length}`)

    // Only create assignments for users who don't already have them
    if (newUserIds.length > 0) {
      const newAssignments = newUserIds.map((userId) => ({
        user_id: userId,
        test_id: testId,
        assigned_at: new Date().toISOString(),
        due_date: dueDate || null,
        status: "assigned",
      }))

      const { error: insertError } = await supabaseServer.from("user_tests").insert(newAssignments)

      if (insertError) {
        console.error("Error creating new assignments:", insertError)
        return NextResponse.json({ error: "Failed to create new assignments" }, { status: 500 })
      }

      console.log(`Successfully created ${newUserIds.length} new assignments`)
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

    const totalAssigned = existingUserIds.length + newUserIds.length
    console.log(
      `Test assigned to ${totalAssigned} users total (${newUserIds.length} new, ${existingUserIds.length} existing)`,
    )
    console.log("=== ASSIGN TEST API - SUCCESS ===")

    return NextResponse.json({
      success: true,
      assignedCount: totalAssigned,
      newAssignments: newUserIds.length,
      existingAssignments: existingUserIds.length,
      message: `Test assigned successfully. ${newUserIds.length} new assignments created, ${existingUserIds.length} existing assignments preserved.`,
    })
  } catch (error) {
    console.error("Error in assign test API:", error)
    console.log("=== ASSIGN TEST API - ERROR ===")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
