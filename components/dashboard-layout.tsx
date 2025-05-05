"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Sidebar } from "@/components/sidebar"
import { getUserId, getUsername } from "@/lib/cookie-utils"

interface DashboardLayoutProps {
  children: React.ReactNode
  requiredRole: "admin" | "user"
  className?: string
}

export function DashboardLayout({ children, requiredRole, className }: DashboardLayoutProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState<string>("User")
  const [isSidebarVisible, setIsSidebarVisible] = useState(true)
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    // Get username from cookie or localStorage
    const userNameFromCookie = getUsername()
    const userNameFromStorage = localStorage.getItem("username")

    const userName = userNameFromCookie || userNameFromStorage || "User"
    setUsername(userName)

    // If we have it in localStorage but not in cookie, restore it
    if (!userNameFromCookie && userNameFromStorage) {
      document.cookie = `username=${userNameFromStorage}; path=/; max-age=${60 * 60 * 24 * 7}`
    }

    // Also check and potentially restore user_id
    const userIdFromCookie = getUserId()
    const userIdFromStorage = localStorage.getItem("user_id")

    if (!userIdFromCookie && userIdFromStorage) {
      document.cookie = `user_id=${userIdFromStorage}; path=/; max-age=${60 * 60 * 24 * 7}`
    }

    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Listen for fullscreen changes
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener("fullscreenchange", handleFullscreenChange)

    // Check initial fullscreen state
    setIsFullscreen(!!document.fullscreenElement)

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange)
    }
  }, [])

  // Function to toggle sidebar visibility
  const toggleSidebar = () => {
    setIsSidebarVisible(!isSidebarVisible)
  }

  return (
    <div className="flex min-h-screen bg-purple-50">
      {/* Hide sidebar when in fullscreen mode */}
      {!isFullscreen && isSidebarVisible && <Sidebar role={requiredRole} username={username} />}
      <div className={`flex-1 ${isSidebarVisible && !isFullscreen ? "md:ml-64" : ""} ${isFullscreen ? "ml-0" : ""}`}>
        <main className={`container mx-auto p-4 md:p-6 ${className || ""}`}>
          {/* Platform name can be displayed in a header if needed */}
          {children}
        </main>
      </div>
    </div>
  )
}
