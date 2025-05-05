"use server"

import { cookies } from "next/headers"
import { getUserByEmailOrUsername, updateUserLastLogin, getUserById } from "@/lib/db/secure-operations"

export async function login(formData: FormData) {
  const email = formData.get("email") as string
  const password = formData.get("password") as string

  if (!email || !password) {
    return { error: "Email and password are required" }
  }

  try {
    console.log("Attempting login for:", email)

    // Use our secure operation to get the user
    const user = await getUserByEmailOrUsername(email)

    if (!user) {
      console.log("No user found with email/username:", email)
      return { error: "Invalid email or password" }
    }

    // In a real app, you would hash and compare passwords
    // This is a simplified version for demonstration
    if (user.password !== password) {
      console.log("Password mismatch for user:", email)
      return { error: "Invalid email or password" }
    }

    // Update last login time using our secure operation
    await updateUserLastLogin(user.id)

    // Set cookies with proper security settings for production
    const cookieOptions = {
      httpOnly: false, // Changed to false to allow client-side access
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days (increased from 1 day)
      path: "/",
      sameSite: "lax" as const,
    }

    // Clear any existing cookies first
    cookies().delete("user_id")
    cookies().delete("role")
    cookies().delete("username")

    // Set new cookies
    cookies().set("user_id", user.id, cookieOptions)
    cookies().set("role", user.role, cookieOptions)
    cookies().set("username", user.username, cookieOptions)

    console.log("Login successful for user:", user.username)
    console.log("Set cookies - user_id:", user.id)
    console.log("Set cookies - role:", user.role)
    console.log("Set cookies - username:", user.username)

    return { success: true, user }
  } catch (err) {
    console.error("Login error:", err)
    return { error: "An error occurred during login" }
  }
}

/**
 * Get the current user based on the user_id cookie
 */
export async function getCurrentUser() {
  try {
    const userId = cookies().get("user_id")?.value

    if (!userId) {
      return null
    }

    return await getUserById(userId)
  } catch (error) {
    console.error("Error getting current user:", error)
    return null
  }
}
