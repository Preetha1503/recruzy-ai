"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Award, BookOpen, ClipboardList, FileText, Home, Settings, User, Users } from "lucide-react"
import { useState } from "react"
import { PLATFORM_NAME } from "@/lib/constants"

interface SidebarProps {
  role: "admin" | "user"
  username: string
}

export function Sidebar({ role, username }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const adminRoutes = [
    {
      href: "/admin/dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/admin/users",
      label: "Users",
      icon: Users,
    },
    {
      href: "/admin/tests",
      label: "Tests",
      icon: ClipboardList,
    },
    {
      href: "/admin/analytics",
      label: "Analytics",
      icon: Award,
    },
    {
      href: "/admin/reports",
      label: "Reports",
      icon: FileText,
    },
    {
      href: "/admin/settings",
      label: "Settings",
      icon: Settings,
    },
  ]

  const userRoutes = [
    {
      href: "/user/dashboard",
      label: "Dashboard",
      icon: Home,
    },
    {
      href: "/user/active-tests",
      label: "Active Tests",
      icon: BookOpen,
    },
    {
      href: "/user/history",
      label: "Test History",
      icon: FileText,
    },
    {
      href: "/user/performance",
      label: "Performance",
      icon: Award,
    },
    {
      href: "/user/profile",
      label: "Profile",
      icon: User,
    },
  ]

  const routes = role === "admin" ? adminRoutes : userRoutes

  const handleLogout = async () => {
    try {
      setIsLoggingOut(true)

      // Call the logout API endpoint
      const response = await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Logout failed")
      }

      // Clear cookies on the client side as a fallback
      document.cookie = "role=; path=/; max-age=0; SameSite=Lax"
      document.cookie = "user_id=; path=/; max-age=0; SameSite=Lax"
      document.cookie = "username=; path=/; max-age=0; SameSite=Lax"

      // Force a hard refresh to the landing page to clear any cached state
      window.location.href = "/home"
    } catch (error) {
      console.error("Error during logout:", error)
      // Even if there's an error, try to redirect
      window.location.href = "/home"
    } finally {
      setIsLoggingOut(false)
    }
  }

  return (
    <div className="fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r bg-white">
      <div className="flex h-16 items-center px-4">
        <Link href="/home" className="text-xl font-bold text-purple-800">
          {PLATFORM_NAME}
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <p className="mb-4 text-sm font-medium text-gray-500">Welcome, {username}</p>
        <nav className="space-y-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`group flex items-center space-x-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-gray-100 hover:text-purple-700 ${
                pathname === route.href ? "bg-gray-100 text-purple-700" : "text-gray-600"
              }`}
            >
              <route.icon className="h-4 w-4" />
              <span>{route.label}</span>
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t p-4">
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-purple-200 text-purple-700"
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Logging out..." : "Logout"}
        </Button>
      </div>
    </div>
  )
}
