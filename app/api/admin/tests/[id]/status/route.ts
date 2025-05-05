import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

// Update PATCH function to properly assign tests to users when publishing
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const role = cookies().get("role")?.value

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const testId = params.id
    const { status, dueDate } = await request.json()

    // Add detailed console logging
    console.log("=== API: TEST STATUS UPDATE - START ===")
    console.log("Test ID:", testId)
    console.log("New Status:", status)
    console.log("Due Date:", dueDate || "Not specified")

    // First, get the test to make sure it exists
    const { data: testData, error: testError } = await supabaseServer
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single()

    if (testError) {
      console.error("Error fetching test:", testError)
      return NextResponse.json({ error: "Test not found" }, { status: 404 })
    }

    // Update the test status
    const { error } = await supabaseServer.from("tests").update({ status }).eq("id", testId)

    if (error) {
      console.error("Error updating test status:", error)
      console.log("=== API: TEST STATUS UPDATE - FAILED ===")
      return NextResponse.json({ error: "Failed to update test status" }, { status: 500 })
    }

    console.log("Test status updated successfully")

    // If the test is being published or activated, assign it to all users with role "user"
    if (status === "published") {
      console.log("Test is being published, assigning to all users with role 'user'")

      // Get all users with role "user"
      const { data: users, error: usersError } = await supabaseServer.from("users").select("id").eq("role", "user")

      if (usersError) {
        console.error("Error fetching users:", usersError)
        console.log("=== API: TEST STATUS UPDATE - PARTIAL SUCCESS ===")
        return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
      }

      console.log(`Found ${users?.length || 0} users to assign test to`)

      if (users && users.length > 0) {
        // For each user, check if the test is already assigned
        let assignmentCount = 0
        let assignmentErrors = 0

        // Create batch assignments for all users
        const assignments = users.map((user) => ({
          user_id: user.id,
          test_id: testId,
          assigned_at: new Date().toISOString(),
          due_date: dueDate || null,
          status: "assigned",
        }))

        // Before inserting, check for existing assignments to avoid duplicates
        for (const assignment of assignments) {
          // Check if this assignment already exists
          const { data: existingAssignment, error: checkError } = await supabaseServer
            .from("user_tests")
            .select("id")
            .eq("user_id", assignment.user_id)
            .eq("test_id", testId)
            .single()

          if (checkError && checkError.code !== "PGRST116") {
            console.error("Error checking existing assignment:", checkError)
            assignmentErrors++
            continue
          }

          // Skip if assignment already exists
          if (existingAssignment) {
            console.log(`Test ${testId} already assigned to user ${assignment.user_id}, skipping`)
            continue
          }

          // Insert the assignment
          const { error: insertError } = await supabaseServer.from("user_tests").insert([assignment])

          if (insertError) {
            console.error(`Error assigning test to user ${assignment.user_id}:`, insertError)
            assignmentErrors++
          } else {
            assignmentCount++
          }
        }

        console.log(`Successfully assigned test to ${assignmentCount} users with ${assignmentErrors} errors`)
      }
    }

    console.log("=== API: TEST STATUS UPDATE - SUCCESS ===")
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in update test status API route:", error)
    console.log("=== API: TEST STATUS UPDATE - ERROR ===")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
