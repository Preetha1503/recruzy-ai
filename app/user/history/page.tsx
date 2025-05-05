"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, Calendar, Clock, Download, FileText, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import Link from "next/link"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { TestResult } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export default function TestHistory() {
  const [results, setResults] = useState<TestResult[]>([])
  const [filteredResults, setFilteredResults] = useState<TestResult[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  // Change the downloadingPdf state from a boolean to an object that tracks each test's download state
  const [downloadingPdf, setDownloadingPdf] = useState<Record<string, boolean>>({})

  useEffect(() => {
    const fetchResults = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get the current user ID from cookies
        const cookies = document.cookie.split("; ")
        const userIdCookie = cookies.find((cookie) => cookie.startsWith("user_id="))
        const userId = userIdCookie ? userIdCookie.split("=")[1] : null
        setUserId(userId)

        if (!userId) {
          console.error("User ID not found in cookies")
          setError("User ID not found. Please log in again.")
          setLoading(false)
          return
        }

        console.log("Fetching test history for user:", userId)

        // Fetch test results from API
        const response = await fetch(`/api/user/history?userId=${userId}`)

        if (!response.ok) {
          throw new Error(`Failed to fetch test history: ${response.statusText}`)
        }

        const data = await response.json()

        if (data.error) {
          throw new Error(data.error)
        }

        console.log("Test results:", data.results)

        // Check if results is an array and has items
        if (!Array.isArray(data.results)) {
          setDebugInfo(`Results is not an array: ${JSON.stringify(data)}`)
          setResults([])
          setFilteredResults([])
        } else {
          setResults(data.results || [])
          setFilteredResults(data.results || [])
          setDebugInfo(`Found ${data.results.length} results`)
        }
      } catch (error: any) {
        console.error("Error fetching test history:", error)
        setError(`An unexpected error occurred: ${error.message}`)
        setDebugInfo(`Error: ${error.message}`)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  useEffect(() => {
    // Filter results based on search query
    if (searchQuery.trim() === "") {
      setFilteredResults(results)
    } else {
      const query = searchQuery.toLowerCase()
      const filtered = results.filter(
        (result) =>
          result.tests?.title?.toLowerCase().includes(query) ||
          result.tests?.topic?.toLowerCase().includes(query) ||
          result.score.toString().includes(query),
      )
      setFilteredResults(filtered)
    }
  }, [searchQuery, results])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  const formatTime = (seconds: number | null) => {
    if (!seconds) return "N/A"

    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return "bg-green-100 text-green-800"
    if (score >= 60) return "bg-yellow-100 text-yellow-800"
    return "bg-red-100 text-red-800"
  }

  // Function to manually refresh the test history
  const refreshHistory = async () => {
    try {
      setLoading(true)
      setError(null)

      if (!userId) {
        setError("User ID not found. Please log in again.")
        return
      }

      const response = await fetch(`/api/user/history?userId=${userId}&refresh=true`)

      if (!response.ok) {
        throw new Error(`Failed to refresh test history: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      console.log("Refreshed test results:", data.results)
      setResults(data.results || [])
      setFilteredResults(data.results || [])
      toast({
        title: "History Refreshed",
        description: `Found ${data.results?.length || 0} test results`,
      })
    } catch (error: any) {
      console.error("Error refreshing test history:", error)
      setError(`Failed to refresh: ${error.message}`)
      toast({
        title: "Refresh Failed",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Update the downloadTestReport function to handle individual test download states
  const downloadTestReport = async (resultId: string) => {
    try {
      // Set downloading state for this specific test only
      setDownloadingPdf((prev) => ({ ...prev, [resultId]: true }))

      // Show loading toast
      toast({
        title: "Generating Report",
        description: "Please wait while we generate your report...",
      })

      // Call the API to generate and download the report
      const response = await fetch(`/api/user/report/download?resultId=${resultId}`)

      if (!response.ok) {
        throw new Error(`Failed to generate report: ${response.statusText}`)
      }

      // Get the blob from the response
      const blob = await response.blob()

      // Create a URL for the blob
      const url = window.URL.createObjectURL(blob)

      // Create a temporary link element
      const a = document.createElement("a")
      a.href = url
      a.download = `test-report-${resultId}.pdf`

      // Append the link to the body
      document.body.appendChild(a)

      // Click the link to trigger the download
      a.click()

      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Success",
        description: "Report downloaded successfully",
      })
    } catch (error) {
      console.error("Error downloading report:", error)
      toast({
        title: "Error",
        description: `Failed to download report: ${error instanceof Error ? error.message : "Unknown error"}`,
        variant: "destructive",
      })
    } finally {
      // Clear downloading state for this specific test only
      setDownloadingPdf((prev) => ({ ...prev, [resultId]: false }))
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
          <h1 className="text-3xl font-bold text-purple-800">Test History</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>User ID not found. Please log out and log in again.</AlertDescription>
          </Alert>
          <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
            <Link href="/api/auth/logout">Log Out</Link>
          </Button>
        </div>
      </DashboardLayout>
    )
  }

  if (error) {
    return (
      <DashboardLayout requiredRole="user">
        <div className="space-y-6">
          <h1 className="text-3xl font-bold text-purple-800">Test History</h1>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button className="bg-purple-700 hover:bg-purple-800 text-white" onClick={refreshHistory}>
            Retry
          </Button>
          {debugInfo && (
            <div className="mt-4 p-4 bg-gray-100 rounded-md">
              <h3 className="font-semibold">Debug Info:</h3>
              <pre className="text-xs mt-2 overflow-auto">{debugInfo}</pre>
            </div>
          )}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout requiredRole="user">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-3xl font-bold text-purple-800">Test History</h1>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
              <Input
                placeholder="Search tests..."
                className="pl-10 border-purple-200 focus:border-purple-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              variant="outline"
              className="border-purple-200 text-purple-700"
              onClick={refreshHistory}
              disabled={loading}
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-purple-700 border-t-transparent"></div>
              ) : (
                "Refresh"
              )}
            </Button>
          </div>
        </div>

        <Tabs defaultValue="all">
          <TabsList className="mb-4">
            <TabsTrigger value="all">All Tests</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4">
            {filteredResults.length > 0 ? (
              filteredResults.map((result) => (
                <Card key={result.id} className="border-purple-200">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl text-purple-800">{result.tests?.title || "Unknown Test"}</CardTitle>
                      <div className={`rounded-full px-3 py-1 text-xs font-medium ${getScoreColor(result.score)}`}>
                        {result.score}%
                      </div>
                    </div>
                    <CardDescription>
                      {result.tests?.topic || "General"} • Completed on {formatDate(result.completed_at)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="mr-1 h-4 w-4 text-purple-500" />
                        Time taken: {formatTime(result.time_taken)}
                      </div>
                      <div className="flex items-center">
                        <FileText className="mr-1 h-4 w-4 text-purple-500" />
                        {result.tests?.topic || "General"}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="mr-1 h-4 w-4 text-purple-500" />
                        {formatDate(result.completed_at)}
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button asChild className="bg-purple-700 hover:bg-purple-800 text-white">
                        <Link href={`/user/test-results/${result.id}`}>View Details</Link>
                      </Button>
                      <Button
                        variant="outline"
                        className="border-purple-200 text-purple-700"
                        onClick={() => downloadTestReport(result.id)}
                        disabled={downloadingPdf[result.id]}
                      >
                        {downloadingPdf[result.id] ? (
                          <>
                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-purple-700 border-t-transparent"></div>
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <Download className="mr-2 h-4 w-4" />
                            Download Report
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="rounded-lg border border-dashed border-gray-300 p-8 text-center">
                <h3 className="text-lg font-medium text-gray-900">No test results found</h3>
                <p className="mt-1 text-sm text-gray-500">You haven't completed any tests yet.</p>
                <Button className="mt-4 bg-purple-700 hover:bg-purple-800 text-white" onClick={refreshHistory}>
                  Refresh History
                </Button>
                {debugInfo && (
                  <div className="mt-4 p-4 bg-gray-100 rounded-md text-left">
                    <h3 className="font-semibold">Debug Info:</h3>
                    <pre className="text-xs mt-2 overflow-auto">{debugInfo}</pre>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
}
