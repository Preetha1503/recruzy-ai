import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const userId = request.cookies.get("user_id")?.value
  const role = request.cookies.get("role")?.value
  const path = request.nextUrl.pathname

  // Public paths that don't require authentication
  const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password", "/", "/home"]
  if (publicPaths.includes(path)) {
    // If user is already logged in, redirect to dashboard
    if (userId && role) {
      // Don't redirect from /home even if logged in
      if (path === "/home") {
        return NextResponse.next()
      }
      return NextResponse.redirect(new URL(role === "admin" ? "/admin/dashboard" : "/user/dashboard", request.url))
    }
    return NextResponse.next()
  }

  // Check if user is authenticated
  if (!userId || !role) {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  // Check role-specific paths
  if (path.startsWith("/admin") && role !== "admin") {
    return NextResponse.redirect(new URL("/user/dashboard", request.url))
  }

  if (path.startsWith("/user") && role !== "user" && role !== "admin") {
    return NextResponse.redirect(new URL("/home", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
