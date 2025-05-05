import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET() {
  try {
    // Check authentication
    const role = cookies().get("role")?.value

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get users from database
    const { data: users, error } = await supabaseServer
      .from("users")
      .select("*")
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // Return users
    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error("Unexpected error in users API:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}
