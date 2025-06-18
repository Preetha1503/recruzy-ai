"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Calendar, Clock, FileText, RefreshCw } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

interface Test {
  id: string
  title: string
  description: string
  topic: string
  duration: number
  status: string
  created_at: string
  due_date: string | null
  user_test_id?: string
  assigned_at?: string
  assignment_status?: string
}

export default function ActiveTests() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // Function to get user ID from cookies
  const getUserIdFromCookies = () => {
    const cookies = document.cookie.split("; ")
    const userIdCookie = cookies.find((cookie) => cookie.startsWith("user_id="))
    return userIdCookie ? userIdCookie.split("=")[1] : null
  }

  // Function to fetch tests
  const fetchTests = async (currentUserId: string) => {
    try {
      setError(null)
      console.log("Fetching tests for user:", currentUserId)

      const response = await fetch(`/api/user/tests?userId=${currentUserId}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`API Error: ${response.status} - ${response.statusText}`)
        console.error("Error response:", errorText)
        throw new Error(`Failed to fetch tests: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API Response:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      const assignedTests = data.assignedTests || []
      console.log(`Loaded ${assignedTests.length} assigned tests`)
      setTests(assignedTests)

      return assignedTests
    } catch (err) {
      console.error("Error fetching tests:", err)
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
      setError(`Failed to load tests: ${errorMessage}`)
      return []
    }
  }

  // Initialize on component mount
  useEffect(() => {
    const initializeTests = async () => {
      setLoading(true)

      const currentUserId = getUserIdFromCookies()
      console.log("Current user ID from cookies:", currentUserId)

      if (!currentUserId) {
        setError("User ID not found. Please log in again.")
        setLoading(false)
        return
      }

      setUserId(currentUserId)
      await fetchTests(currentUserId)
      setLoading(false)
    }

    initializeTests()
  }, [])

  // Refresh function
  const handleRefresh = async () => {
    if (!userId) return

    setRefreshing(true)
    try {
      await fetchTests(userId)
      toast({
        title: "Tests Refreshed",
        description: "Test list has been refreshed successfully.",
      })
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh tests.",
      })
    } finally {
      setRefreshing(false)
    }
  }

  // Format due date
  const formatDueDate = (dueDateString: string | null) => {
    if (!dueDateString) return "No due date"

    try {
      const dueDate = new Date(dueDateString)
      if (isNaN(dueDate.getTime())) return "Invalid date"

      const now = new Date()
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        return `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? "s" : ""}`
      } else if (diffDays === 0) {
        return "Due today"
      } else if (diffDays === 1) {
        return "Due tomorrow"
      } else if (diffDays <= 7) {
        return `Due in ${diffDays} days`
      } else {
        return dueDate.toLocaleDateString()
      }
    } catch (error) {
      console.error("Error formatting due date:", error)
      return "Invalid date"
    }
  }

  // Get due date color
  const getDueDateColor = (dueDateString: string | null) => {
    if (!dueDateString) return "bg-gray-100 text-gray-800"

    try {
      const dueDate = new Date(dueDateString)
      if (isNaN(dueDate.getTime())) return "bg-gray-100 text-gray-800"

      const now = new Date()
      const diffTime = dueDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

      if (diffDays < 0) {
        return "bg-red-100 text-red-800"
      } else if (diffDays <= 1) {
        return "bg-orange-100 text-orange-800"
      } else if (diffDays <= 3) {
        return "bg-yellow-100 text-yellow-800"
      } else {
        return "bg-green-100 text-green-800"
      }
    } catch (error) {
      return "bg-gray-100 text-gray-800"
    }
  }

  if (loading) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-purple-800">Active Tests</h1>
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  if (!userId) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-purple-800">Active Tests</h1>
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

  return (
    <DashboardLayout requiredRole="user">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-purple-800">Active Tests</h1>
          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="bg-purple-100 text-purple-800">
              {tests.length} test{tests.length !== 1 ? "s" : ""} assigned
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-purple-200 text-purple-700"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        <div className="text-sm text-gray-500">User ID: {userId}</div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button variant="outline" size="sm" onClick={handleRefresh} className="ml-4" disabled={refreshing}>
                Try Again
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {tests.length === 0 && !error ? (
          <Card className="border-purple-200">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-16 w-16 text-purple-300 mb-4" />
              <h3 className="text-xl font-semibold text-purple-800 mb-2">No Tests Assigned</h3>
              <p className="text-purple-600 text-center max-w-md mb-4">
                You don't have any active tests assigned to you at the moment. Check back later or contact your
                administrator if you believe this is an error.
              </p>
              <Button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-purple-700 hover:bg-purple-800 text-white"
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                Refresh Tests
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.map((test) => (
              <Card key={test.id} className="border-purple-200 hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg text-purple-800">{test.title}</CardTitle>
                      <CardDescription className="text-purple-600">{test.topic}</CardDescription>
                    </div>
                    <Badge variant="outline" className="border-purple-200 text-purple-700">
                      {test.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {test.description && <p className="text-sm text-gray-600 line-clamp-2">{test.description}</p>}

                  <div className="space-y-2">
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="mr-2 h-4 w-4" />
                      Duration: {test.duration} minutes
                    </div>

                    <div className="flex items-center text-sm">
                      <Calendar className="mr-2 h-4 w-4" />
                      <Badge className={getDueDateColor(test.due_date)}>{formatDueDate(test.due_date)}</Badge>
                    </div>

                    {test.assigned_at && (
                      <div className="text-xs text-gray-500">
                        Assigned: {new Date(test.assigned_at).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  <Button asChild className="w-full bg-purple-700 hover:bg-purple-800 text-white">
                    <Link href={`/user/take-test/${test.id}`}>Start Test</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
