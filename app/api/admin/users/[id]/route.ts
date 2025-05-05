import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    // Check if user is admin
    const role = cookies().get("role")?.value

    if (role !== "admin") {
      console.log("DELETE API: Unauthorized access attempt")
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const userId = params.id

    console.log(`DELETE API: Attempting to delete user with ID: ${userId}`)

    // Construct the SQL query for logging purposes
    const query = supabaseServer.from("users").delete().eq("id", userId).sql

    console.log("DELETE API: Supabase query:", query)

    // Delete the user
    const { data, error } = await supabaseServer.from("users").delete().eq("id", userId).select() // Add select to view the data being deleted

    if (error) {
      console.error("DELETE API: Error deleting user:", error)
      console.error("DELETE API: Supabase query:", {
        table: "users",
        operation: "delete",
        eq: { id: userId },
      })
      return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
    }

    console.log(`DELETE API: User with ID ${userId} deleted successfully`)
    console.log("DELETE API: Deleted user data:", data) // Log the deleted data

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE API: Error in delete user API route:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
