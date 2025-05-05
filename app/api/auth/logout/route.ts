import { NextResponse } from "next/server"

export async function POST() {
  const response = NextResponse.json({ success: true })

  // Clear cookies with proper settings
  response.cookies.set("user_id", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  response.cookies.set("role", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  response.cookies.set("username", "", {
    httpOnly: true,
    expires: new Date(0),
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  })

  return response
}

// Keep the GET method for backward compatibility
export async function GET() {
  return POST()
}
