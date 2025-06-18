import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const role = cookies().get("role")?.value

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const testId = params.id

    console.log("=== FETCH ASSIGNED USERS API - START ===")
    console.log("Test ID:", testId)

    // Get users assigned to this test through user_tests table
    const { data: userTests, error: userTestsError } = await supabaseServer
      .from("user_tests")
      .select(`
        user_id,
        users (
          id,
          email,
          role
        )
      `)
      .eq("test_id", testId)

    if (userTestsError) {
      console.error("Error fetching assigned users:", userTestsError)
      return NextResponse.json({ error: "Failed to fetch assigned users" }, { status: 500 })
    }

    // Transform the data to get user information
    const assignedUsers = (userTests || [])
      .filter((ut) => ut.users) // Filter out any null users
      .map((ut) => ({
        id: ut.users.id,
        email: ut.users.email,
        role: ut.users.role,
        name: ut.users.email.split("@")[0], // Use email prefix as display name
      }))

    console.log(`Found ${assignedUsers.length} assigned users`)
    console.log("Assigned users:", assignedUsers)
    console.log("=== FETCH ASSIGNED USERS API - SUCCESS ===")

    return NextResponse.json({
      users: assignedUsers,
      count: assignedUsers.length,
    })
  } catch (error) {
    console.error("Error in fetch assigned users API:", error)
    console.log("=== FETCH ASSIGNED USERS API - ERROR ===")
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
