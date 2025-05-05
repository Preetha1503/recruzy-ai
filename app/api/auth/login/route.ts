import { type NextRequest, NextResponse } from "next/server"
import { getUserByEmailOrUsername, updateUserLastLogin } from "@/lib/db/secure-operations"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    console.log("API route: Attempting login for:", email)

    // Use our secure operation to get the user
    const user = await getUserByEmailOrUsername(email)

    if (!user) {
      console.log("API route: No user found with email/username:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // In a real app, you would hash and compare passwords
    // This is a simplified version for demonstration
    if (user.password !== password) {
      console.log("API route: Password mismatch for user:", email)
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    // Update last login time using our secure operation
    await updateUserLastLogin(user.id)

    // Create a response object
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        redirectUrl: user.role === "admin" ? "/admin/dashboard" : "/user/dashboard",
      },
    })

    // Set cookies on the response
    response.cookies.set("user_id", user.id, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    response.cookies.set("role", user.role, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    response.cookies.set("username", user.username, {
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    console.log("API route: Login successful for user:", user.username)
    return response
  } catch (err) {
    console.error("API route: Login error:", err)
    return NextResponse.json({ error: "An error occurred during login" }, { status: 500 })
  }
}
