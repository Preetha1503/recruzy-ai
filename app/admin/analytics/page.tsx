"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle } from "lucide-react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface AnalyticsData {
  totalUsers: number
  activeUsers: number
  averageScore: number
  totalTests: number
  completedTests: number
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true)
        setError(null)
        console.log("Fetching analytics data...")

        // Fetch total users
        const usersResponse = await fetch("/api/admin/analytics/users")
        if (!usersResponse.ok) {
          throw new Error(`Users API returned ${usersResponse.status}: ${usersResponse.statusText}`)
        }
        const usersData = await usersResponse.json()
        console.log("Users data:", usersData)

        // Fetch test data
        const testsResponse = await fetch("/api/admin/analytics/tests")
        if (!testsResponse.ok) {
          throw new Error(`Tests API returned ${testsResponse.status}: ${testsResponse.statusText}`)
        }
        const testsData = await testsResponse.json()
        console.log("Tests data:", testsData)

        // Fetch test results data
        const resultsResponse = await fetch("/api/admin/analytics/results")
        if (!resultsResponse.ok) {
          const errorText = await resultsResponse.text()
          console.error("Results API error:", errorText)
          throw new Error(`Results API returned ${resultsResponse.status}: ${resultsResponse.statusText}`)
        }
        const resultsData = await resultsResponse.json()
        console.log("Results data:", resultsData)

        // Save debug info
        setDebugInfo({
          users: usersData,
          tests: testsData,
          results: resultsData,
        })

        setAnalyticsData({
          totalUsers: usersData?.data?.totalUsers || 0,
          activeUsers: usersData?.data?.activeUsers || 0,
          totalTests: testsData?.data?.totalTests || 0,
          completedTests: resultsData?.data?.completedTests || 0,
          averageScore: resultsData?.data?.averageScore || 0,
        })
      } catch (err: any) {
        console.error("Error fetching analytics data:", err)
        setError(`Failed to load analytics data: ${err.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalyticsData()
  }, [])

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-purple-800">Analytics Dashboard</h1>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Total Users Card */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Total Users</CardTitle>
              <CardDescription>Number of registered users</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-purple-600">{analyticsData?.totalUsers || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Active Users Card */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Active Users</CardTitle>
              <CardDescription>Number of users active in the last 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-purple-600">{analyticsData?.activeUsers || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Average Score Card */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Average Score</CardTitle>
              <CardDescription>Average test score of all users</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-purple-600">{analyticsData?.averageScore || 0}%</div>
              )}
            </CardContent>
          </Card>

          {/* Total Tests Card */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Total Tests</CardTitle>
              <CardDescription>Number of tests created</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-purple-600">{analyticsData?.totalTests || 0}</div>
              )}
            </CardContent>
          </Card>

          {/* Completed Tests Card */}
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Completed Tests</CardTitle>
              <CardDescription>Number of tests completed by users</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center items-center h-24">
                  <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-200 border-t-purple-700"></div>
                </div>
              ) : (
                <div className="text-3xl font-bold text-purple-600">{analyticsData?.completedTests || 0}</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Debug Information (only in development) */}
        {process.env.NODE_ENV === "development" && debugInfo && (
          <Card className="mt-8 border-amber-200">
            <CardHeader>
              <CardTitle className="text-xl text-amber-800">Debug Information</CardTitle>
              <CardDescription>Raw data from API responses</CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-xs">
                {JSON.stringify(debugInfo, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
