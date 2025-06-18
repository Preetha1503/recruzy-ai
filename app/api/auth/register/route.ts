import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const username = formData.get("username") as string
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const confirmPassword = formData.get("confirmPassword") as string

    if (!username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 })
    }

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseServer
      .from("users")
      .select("*")
      .or(`email.eq.${email},username.eq.${username}`)
      .single()

    if (existingUser) {
      return NextResponse.json({ error: "Username or email already exists" }, { status: 409 })
    }

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Error checking existing user:", checkError)
      return NextResponse.json({ error: "Failed to check existing user" }, { status: 500 })
    }

    // Create new user
    const { data: newUser, error } = await supabaseServer
      .from("users")
      .insert([
        {
          username,
          email,
          password, // In a real app, this would be hashed
          role: "user",
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Registration error:", error)
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
    }

    console.log(`New user created successfully: ${newUser.username} (${newUser.id})`)

    // IMPROVED CODE: Assign all published tests to the new user
    try {
      // Get all published tests
      const { data: publishedTests, error: testsError } = await supabaseServer
        .from("tests")
        .select("id, title")
        .eq("status", "published")

      if (testsError) {
        console.error("Error fetching published tests:", testsError)
      } else if (publishedTests && publishedTests.length > 0) {
        console.log(`Found ${publishedTests.length} published tests to assign to new user ${newUser.id}`)
        publishedTests.forEach((test) => console.log(`- Assigning: ${test.title} (${test.id})`))

        // Create assignments for each published test
        const assignments = publishedTests.map((test) => ({
          user_id: newUser.id,
          test_id: test.id,
          assigned_at: new Date().toISOString(),
          status: "assigned",
        }))

        // Insert all assignments
        const { error: assignError } = await supabaseServer.from("user_tests").insert(assignments)

        if (assignError) {
          console.error("Error assigning tests to new user:", assignError)
        } else {
          console.log(`Successfully assigned ${assignments.length} tests to new user ${newUser.id}`)
        }
      } else {
        console.log("No published tests found to assign to new user")
      }
    } catch (assignmentError) {
      console.error("Error in test assignment process:", assignmentError)
      // Don't return an error here, as the user was created successfully
    }

    // Return success response WITHOUT setting cookies
    return NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    })
  } catch (err) {
    console.error("Registration error:", err)
    return NextResponse.json({ error: "An error occurred during registration" }, { status: 500 })
  }
}
