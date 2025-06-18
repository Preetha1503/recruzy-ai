"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Award, BookOpen, CheckCircle, Clock, FileText, AlertCircle } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserId, setCookie } from "@/lib/cookie-utils"

interface Test {
  id: string
  title: string
  description: string
  topic: string
  duration: number
  status: string
  created_at: string
  assignment_status?: string
  assigned_at?: string
  due_date?: string | null
}

interface TestResult {
  id: string
  test_id: string
  score: number
  time_taken: number
  completed_at: string
  tests: {
    title: string
    topic: string
  }
}

export default function UserDashboard() {
  const [activeTests, setActiveTests] = useState<Test[]>([])
  const [recentResults, setRecentResults] = useState<TestResult[]>([])
  const [stats, setStats] = useState({
    testsCompleted: 0,
    averageScore: 0,
    activeTestsCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)

  useEffect(() => {
    // Try to get user ID from localStorage as a fallback
    const localUserId = localStorage.getItem("user_id")

    // First check cookies
    let userIdFromCookie = getUserId()

    // If not in cookies but in localStorage, restore the cookie
    if (!userIdFromCookie && localUserId) {
      setCookie("user_id", localUserId)
      userIdFromCookie = localUserId
      console.log("Restored user_id cookie from localStorage:", localUserId)
    }

    setUserId(userIdFromCookie)

    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const currentUserId = userIdFromCookie

        if (!currentUserId) {
          console.error("User ID not found in cookies or localStorage")
          setError("User ID not found. Please log in again.")
          setLoading(false)
          return
        }

        // Store in localStorage as backup
        localStorage.setItem("user_id", currentUserId)

        console.log("Fetching dashboard data for user:", currentUserId)

        // Fetch dashboard data from API
        const response = await fetch(`/api/user/dashboard?userId=${currentUserId}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.error("API Response Error:", response.status, errorText)
          throw new Error(`Failed to fetch dashboard data: ${response.status} ${response.statusText}`)
        }

        const data = await response.json()
        console.log("Dashboard API Response:", data)

        if (data.error) {
          throw new Error(data.error)
        }

        setActiveTests(data.activeTests || [])
        setRecentResults(data.recentResults || [])
        setStats({
          testsCompleted: data.testsCompleted || 0,
          averageScore: data.averageScore || 0,
          activeTestsCount: data.activeTestsCount || 0,
        })
      } catch (error: any) {
        console.error("Error fetching dashboard data:", error)
        setError(`Failed to load dashboard: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    if (userIdFromCookie) {
      fetchDashboardData()
    } else {
      setLoading(false)
    }
  }, [])

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      const now = new Date()
      const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays === 0) return "Today"
      if (diffDays === 1) return "Yesterday"
      if (diffDays < 7) return `${diffDays} days ago`
      return date.toLocaleDateString()
    } catch {
      return "Unknown date"
    }
  }

  const formatDueDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No due date"

    try {
      const dueDate = new Date(dateString)
      const now = new Date()
      const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return "Overdue"
      if (diffDays === 0) return "Due today"
      if (diffDays === 1) return "Due tomorrow"
      if (diffDays < 7) return `Due in ${diffDays} days`
      return dueDate.toLocaleDateString()
    } catch {
      return "Invalid date"
    }
  }

  const getDueDateColor = (dateString: string | null | undefined) => {
    if (!dateString) return "bg-gray-100 text-gray-800"

    try {
      const dueDate = new Date(dateString)
      const now = new Date()
      const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return "bg-red-100 text-red-800"
      if (diffDays <= 1) return "bg-orange-100 text-orange-800"
      if (diffDays <= 3) return "bg-yellow-100 text-yellow-800"
      return "bg-green-100 text-green-800"
    } catch {
      return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!userId) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-purple-800">Your Dashboard</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>User ID not found. Please log out and log in again.</AlertDescription>
          </Alert>
          <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
            <Link href="/login">Log In Again</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-purple-800">Your Dashboard</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => window.location.reload()} className="bg-purple-700 hover:bg-purple-800 text-white">
            Retry
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="user">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-purple-800">Your Dashboard</h1>
        <div className="text-sm text-gray-500">User ID: {userId}</div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">Tests Completed</CardTitle>
              <CheckCircle className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{stats.testsCompleted}</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">Average Score</CardTitle>
              <Award className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{stats.averageScore}%</div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">Active Tests</CardTitle>
              <BookOpen className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{stats.activeTestsCount}</div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Active Tests */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Active Tests</CardTitle>
              <CardDescription>Tests assigned to you that need to be completed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeTests.length > 0 ? (
                  activeTests.map((test) => (
                    <div key={test.id} className="rounded-lg border border-purple-100 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-purple-800">{test.title}</h3>
                        <Badge className={getDueDateColor(test.due_date)} variant="secondary">
                          {formatDueDate(test.due_date)}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <Clock className="mr-1 h-4 w-4 text-purple-500" />
                        {test.duration} min
                        <FileText className="ml-3 mr-1 h-4 w-4 text-purple-500" />
                        {test.topic}
                      </div>
                      <div className="mt-3">
                        <Button asChild size="sm" className="bg-purple-700 hover:bg-purple-800 text-white">
                          <Link href={`/user/take-test/${test.id}`}>Start Test</Link>
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Assigned</h3>
                    <p className="text-gray-500 mb-4">You don't have any active tests assigned to you at the moment.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-purple-700 hover:bg-purple-800 text-white">
                <Link href="/user/active-tests">View All Active Tests</Link>
              </Button>
            </CardFooter>
          </Card>

          {/* Recent Results */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Recent Results</CardTitle>
              <CardDescription>Your performance in recently completed tests</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {recentResults.length > 0 ? (
                  recentResults.map((result) => (
                    <div key={result.id} className="rounded-lg border border-purple-100 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-purple-800">{result.tests?.title || "Unknown Test"}</h3>
                        <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          {result.score}%
                        </div>
                      </div>
                      <div className="mt-2 text-sm text-gray-500">Completed {formatDate(result.completed_at)}</div>
                    </div>
                  ))
                ) : (
                  <div className="py-8 text-center">
                    <Award className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                    <p className="text-gray-500">Complete a test to see your results here.</p>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button asChild className="w-full bg-purple-700 hover:bg-purple-800 text-white">
                <Link href="/user/history">View All Results</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
