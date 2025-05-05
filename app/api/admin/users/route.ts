import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
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

export async function POST(request: Request) {
  try {
    // Check if user is admin
    const role = cookies().get("role")?.value

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const userData = await request.json()

    // Validate user data
    if (!userData.email || !userData.password || !userData.username) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabaseServer
      .from("users")
      .select("*")
      .or(`email.eq.${userData.email},username.eq.${userData.username}`)

    if (checkError) {
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: "Failed to check existing user" }, { status: 500 })
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 })
    }

    // Create new user
    const { data, error } = await supabaseServer
      .from("users")
      .insert([
        {
          username: userData.username,
          email: userData.email,
          password: userData.password, // In a real app, this would be hashed
          role: userData.role || "user",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // NEW CODE: Assign all published tests to the new user if they are a regular user
    if (userData.role !== "admin") {
      try {
        // Get all published tests
        const { data: publishedTests, error: testsError } = await supabaseServer
          .from("tests")
          .select("id")
          .eq("status", "published")

        if (testsError) {
          console.error("Error fetching published tests:", testsError)
        } else if (publishedTests && publishedTests.length > 0) {
          console.log(`Found ${publishedTests.length} published tests to assign to new user ${data.id}`)

          // Create assignments for each published test
          const assignments = publishedTests.map((test) => ({
            user_id: data.id,
            test_id: test.id,
            assigned_at: new Date().toISOString(),
            status: "assigned",
          }))

          // Insert all assignments
          const { error: assignError } = await supabaseServer.from("user_tests").insert(assignments)

          if (assignError) {
            console.error("Error assigning tests to new user:", assignError)
          } else {
            console.log(`Successfully assigned ${assignments.length} tests to new user ${data.id}`)
          }
        } else {
          console.log("No published tests found to assign to new user")
        }
      } catch (assignmentError) {
        console.error("Error in test assignment process:", assignmentError)
        // Don't return an error here, as the user was created successfully
      }
    }

    return NextResponse.json({ user: data, message: "User created successfully" }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}
