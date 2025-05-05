"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Clock, FileText, Calendar, AlertCircle, Bug, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { getUserId, setCookie } from "@/lib/cookie-utils"
import { useToast } from "@/hooks/use-toast"
import type { Test } from "@/lib/types"

interface AssignedTest extends Test {
  due_date?: string | null
  user_test_id?: string
}

export default function ActiveTests() {
  const [tests, setTests] = useState<AssignedTest[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // Function to fetch tests for the user
  const fetchTests = async (userId: string) => {
    try {
      setError(null)

      console.log("Fetching tests for user:", userId)

      // Use a direct API call to fetch tests for the user
      const response = await fetch(`/api/user/tests?userId=${userId}`)

      if (!response.ok) {
        console.error(`Failed to fetch tests: Status ${response.status} - ${response.statusText}`)
        throw new Error(`Failed to fetch tests: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("API response:", data)

      if (data.error) {
        throw new Error(data.error)
      }

      // Only use assigned tests, don't separate into tests and publishedTests
      setTests(data.assignedTests || [])
      console.log(`Loaded ${data.assignedTests?.length || 0} assigned tests`)

      // If no tests found, automatically try to fix assignments
      if (!data.assignedTests || data.assignedTests.length === 0) {
        console.log("No tests found, attempting to fix assignments automatically")
        await handleFixAssignments(userId)
      }

      // Fetch debug info
      await fetchDebugInfo(userId)

      return data.assignedTests || []
    } catch (err) {
      console.error("Error fetching active tests:", err)
      setError(`An unexpected error occurred: ${err.message}`)
      return []
    }
  }

  // Function to fetch debug info
  const fetchDebugInfo = async (userId: string) => {
    try {
      const debugResponse = await fetch(`/api/debug/user-tests?userId=${userId}`)
      if (debugResponse.ok) {
        const debugData = await debugResponse.json()
        setDebugInfo(debugData)

        // If there are unassigned published tests, fix them automatically
        if (debugData.unassignedPublishedTests && debugData.unassignedPublishedTests.length > 0) {
          console.log(`Found ${debugData.unassignedPublishedTests.length} unassigned published tests. Fixing...`)
          await handleFixAssignments(userId)
        }
      }
    } catch (debugError) {
      console.error("Error fetching debug info:", debugError)
    }
  }

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

    const initializeTests = async () => {
      setLoading(true)

      if (userIdFromCookie) {
        // Store in localStorage as backup
        localStorage.setItem("user_id", userIdFromCookie)
        await fetchTests(userIdFromCookie)
      } else {
        console.error("User ID not found in cookies or localStorage")
        setError("User ID not found. Please log in again.")
      }

      setLoading(false)
    }

    initializeTests()
  }, [])

  // Fix the formatDueDate function to correctly handle due dates
  const formatDueDate = (dateString: string | null | undefined) => {
    if (!dateString) return "No due date"

    try {
      const dueDate = new Date(dateString)
      // Check if the date is valid
      if (isNaN(dueDate.getTime())) return "No due date"

      const now = new Date()
      const diffDays = Math.floor((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

      if (diffDays < 0) return "Overdue"
      if (diffDays === 0) return "Today"
      if (diffDays === 1) return "Tomorrow"
      if (diffDays < 7) return `In ${diffDays} days`
      return dueDate.toLocaleDateString()
    } catch (error) {
      console.error("Error formatting due date:", error)
      return "No due date"
    }
  }

  const getStatusBadgeClass = (dueDate: string | null | undefined) => {
    if (!dueDate) return "bg-gray-100 text-gray-800"

    const date = dueDate ? new Date(dueDate) : null
    const now = new Date()

    if (!date) return "bg-gray-100 text-gray-800"

    if (date < now) return "bg-red-100 text-red-800"

    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (diffDays <= 2) return "bg-yellow-100 text-yellow-800"
    return "bg-green-100 text-green-800"
  }

  const handleManualLogin = () => {
    // For testing - manually set a user ID
    const testUserId = prompt("Enter a test user ID:")
    if (testUserId) {
      setCookie("user_id", testUserId)
      localStorage.setItem("user_id", testUserId)
      window.location.reload()
    }
  }

  const handleFixAssignments = async (userIdParam?: string) => {
    const userToFix = userIdParam || userId
    if (!userToFix) return

    try {
      setRefreshing(true)
      const response = await fetch("/api/user/fix-assignments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: userToFix }),
      })

      if (response.ok) {
        const data = await response.json()

        if (data.assignedTests && data.assignedTests > 0) {
          toast({
            title: "Tests Assigned",
            description: `Successfully assigned ${data.assignedTests} new tests.`,
          })
        }

        // Refresh the tests list
        await fetchTests(userToFix)
      } else {
        const data = await response.json()
        setError(data.error || "Failed to fix assignments")
      }
    } catch (err) {
      setError("An error occurred while fixing assignments")
    } finally {
      setRefreshing(false)
    }
  }

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
          <h1 className="text-3xl font-bold text-purple-800">Active Tests</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>User ID not found. Please log out and log in again.</AlertDescription>
          </Alert>
          <div className="flex flex-col space-y-4">
            <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
              <Link href="/login">Log In Again</Link>
            </Button>
            <Button onClick={handleManualLogin} variant="outline">
              Set User ID Manually (Debug)
            </Button>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="user">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold text-purple-800">Active Tests</h1>
          <div className="flex gap-2 mt-4 sm:mt-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="border-purple-200 text-purple-700"
            >
              <Bug className="mr-2 h-4 w-4" />
              {showDebug ? "Hide Debug" : "Show Debug"}
            </Button>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFixAssignments()}
              disabled={refreshing}
              className="border-purple-200 text-purple-700"
            >
              {refreshing ? "Fixing..." : "Fix Assignments"}
            </Button>
          </div>
        </div>
        <div className="text-sm text-gray-500">User ID: {userId}</div>

        {showDebug && debugInfo && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <div className="text-xs font-mono overflow-auto">
              <p>Published Tests: {debugInfo.diagnostics.totalPublishedTests}</p>
              <p>Assigned Tests: {debugInfo.diagnostics.totalAssignedTests}</p>
              <p>Missing Assignments: {debugInfo.diagnostics.missingAssignments}</p>
              {debugInfo.unassignedPublishedTests && debugInfo.unassignedPublishedTests.length > 0 && (
                <div>
                  <p className="font-bold mt-2">Unassigned Published Tests:</p>
                  <ul>
                    {debugInfo.unassignedPublishedTests.map((test: any) => (
                      <li key={test.id}>
                        {test.title} (ID: {test.id})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {tests.length === 0 && !loading && !error && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No active tests found. We've attempted to fix assignments automatically. If you still don't see any tests,
              please contact an administrator.
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Tests ({tests.length})</TabsTrigger>
            <TabsTrigger value="assigned">Assigned ({tests.length})</TabsTrigger>
            <TabsTrigger value="overdue">
              Overdue (
              {
                tests.filter((test) => {
                  if (!test.due_date) return false
                  return new Date(test.due_date) < new Date()
                }).length
              }
              )
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {tests.length > 0 ? (
              tests.map((test) => (
                <Card key={test.id} className="border-purple-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-purple-800">{test.title}</CardTitle>
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(test.due_date)}`}
                      >
                        {formatDueDate(test.due_date)}
                      </div>
                    </div>
                    <CardDescription>{test.description || "No description provided"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-purple-500" />
                        {test.duration} minutes
                      </div>
                      <div className="flex items-center">
                        <FileText className="mr-1 h-4 w-4 text-purple-500" />
                        {test.topic}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4 text-purple-500" />
                        {new Date(test.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                        <Link href={`/user/take-test/${test.id}`}>Start Test</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">No active tests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any active tests assigned to you at the moment.
                </p>
                <div className="mt-4">
                  <Button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="bg-purple-700 hover:bg-purple-800 text-white"
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    Refresh Tests
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="assigned" className="space-y-4">
            {tests.length > 0 ? (
              tests.map((test) => (
                <Card key={test.id} className="border-purple-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-purple-800">{test.title}</CardTitle>
                      <div
                        className={`rounded-full px-3 py-1 text-xs font-medium ${getStatusBadgeClass(test.due_date)}`}
                      >
                        {formatDueDate(test.due_date)}
                      </div>
                    </div>
                    <CardDescription>{test.description || "No description provided"}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-purple-500" />
                        {test.duration} minutes
                      </div>
                      <div className="flex items-center">
                        <FileText className="mr-1 h-4 w-4 text-purple-500" />
                        {test.topic}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4 text-purple-500" />
                        {new Date(test.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                        <Link href={`/user/take-test/${test.id}`}>Start Test</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">No assigned tests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any tests specifically assigned to you at the moment.
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="overdue" className="space-y-4">
            {tests.filter((test) => {
              if (!test.due_date) return false
              const dueDate = new Date(test.due_date)
              const now = new Date()
              return dueDate < now
            }).length > 0 ? (
              tests
                .filter((test) => {
                  if (!test.due_date) return false
                  const dueDate = new Date(test.due_date)
                  const now = new Date()
                  return dueDate < now
                })
                .map((test) => (
                  <Card key={test.id} className="border-purple-200">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-xl text-purple-800">{test.title}</CardTitle>
                        <div className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800">
                          Overdue
                        </div>
                      </div>
                      <CardDescription>{test.description || "No description provided"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock className="mr-1 h-4 w-4 text-purple-500" />
                          {test.duration} minutes
                        </div>
                        <div className="flex items-center">
                          <FileText className="mr-1 h-4 w-4 text-purple-500" />
                          {test.topic}
                        </div>
                        <div className="flex items-center">
                          <Calendar className="mr-1 h-4 w-4 text-purple-500" />
                          {new Date(test.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="mt-4">
                        <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                          <Link href={`/user/take-test/${test.id}`}>Start Test</Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">No overdue tests</h3>
                <p className="mt-1 text-sm text-gray-500">
                  You don't have any overdue tests. Great job staying on top of your assignments!
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
