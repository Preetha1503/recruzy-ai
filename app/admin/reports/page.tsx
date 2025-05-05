"use client"

import { useState, useEffect } from "react"
import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { FileText, Calendar, User, BarChart3, CheckCircle, Lightbulb, AlertCircle, Download } from "lucide-react"
import { supabase } from "@/lib/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Alert, AlertDescription } from "@/components/ui/alert"
import dynamic from "next/dynamic"

// Dynamically import jsPDF with no SSR
const JsPDF = dynamic(() => import("jspdf"), { ssr: false })

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"performance" | "test" | "">("")
  const [period, setPeriod] = useState("last6months")
  const [selectedUser, setSelectedUser] = useState("")
  const [selectedTest, setSelectedTest] = useState("")
  const [reportTitle, setReportTitle] = useState("")
  const [reportDescription, setReportDescription] = useState("")
  const [users, setUsers] = useState<any[]>([])
  const [tests, setTests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState<any>(null)
  const [aiInsights, setAiInsights] = useState("")
  const [generatingAiInsights, setGeneratingAiInsights] = useState(false)
  const [downloadingPdf, setDownloadingPdf] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Fetch users and tests on page load
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch users from Supabase
        const { data: usersData, error: usersError } = await supabase
          .from("users")
          .select("id, username, email, created_at")
          .eq("role", "user")

        if (usersError) {
          console.error("Error fetching users:", usersError)
          throw new Error(`Failed to fetch users: ${usersError.message}`)
        }

        // Fetch tests from Supabase
        const { data: testsData, error: testsError } = await supabase
          .from("tests")
          .select("id, title, topic, created_at")

        if (testsError) {
          console.error("Error fetching tests:", testsError)
          throw new Error(`Failed to fetch tests: ${testsError.message}`)
        }

        console.log("Fetched users:", usersData)
        console.log("Fetched tests:", testsData)

        setUsers(usersData || [])
        setTests(testsData || [])
      } catch (err: any) {
        console.error("Error fetching data:", err)
        setError(`Failed to load data: ${err.message}`)
        setUsers([])
        setTests([])
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const generateReport = async () => {
    try {
      setGenerating(true)
      setError(null)
      setAiInsights("")
      setReportData(null)

      console.log("Starting report generation:", {
        reportType,
        selectedUser,
        selectedTest,
        period,
      })

      // Validate parameters
      if (!reportType || (reportType === "performance" && !selectedUser) || (reportType === "test" && !selectedTest)) {
        setError("Invalid parameters")
        return
      }

      // Construct the API URL
      let apiUrl = `/api/admin/reports/generate?reportType=${reportType}&period=${period}`
      if (selectedUser) apiUrl += `&selectedUser=${selectedUser}`
      if (selectedTest) apiUrl += `&selectedTest=${selectedTest}`

      // Call the API to generate the report data
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("API Error:", errorData)
        throw new Error(`Failed to generate report: ${response.statusText} - ${errorData?.error || "Unknown error"}`)
      }

      const data = await response.json()
      console.log("Report data received:", data)
      setReportData(data)

      // Set default custom title based on report type
      if (reportType === "performance") {
        const user = users.find((u) => u.id === selectedUser)
        setReportTitle(`Performance Report for ${user?.username || "User"}`)
      } else {
        const test = tests.find((t) => t.id === selectedTest)
        setReportTitle(`Test Analysis Report for ${test?.title || "Test"}`)
      }

      toast({
        title: "Report Generated",
        description: "Your report has been generated successfully.",
      })
    } catch (err: any) {
      console.error("Error generating report:", err)
      setError(`Failed to generate report: ${err.message}`)
      toast({
        title: "Error",
        description: err.message || "Failed to generate report",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const downloadPdf = async () => {
    if (!reportData) return

    setDownloadingPdf(true)
    try {
      // Import jsPDF
      const jsPDF = await import("jspdf")

      // Create new jsPDF instance
      const doc = new jsPDF.default({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      })

      // Define colors and styles
      const primaryColor = [107, 70, 193] // Purple in RGB
      const textColor = [60, 60, 60] // Dark gray
      const lightGray = [200, 200, 200] // Light gray for lines
      const fontSize = 10
      const headerFontSize = 14

      // Add header with logo and title
      doc.setFillColor(245, 245, 250) // Light purple background
      doc.rect(0, 0, 210, 30, "F")

      // Add title
      doc.setFontSize(20)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text("SAMAJH AI-Powered Interview Platform", 105, 15, { align: "center" })

      // Add report title
      doc.setFontSize(16)
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(reportTitle || reportData.reportTitle, 105, 40, { align: "center" })

      // Add report description
      doc.setFontSize(10)
      doc.text(reportDescription || reportData.reportDescription, 105, 48, { align: "center", maxWidth: 150 })

      // Add date
      doc.setFontSize(10)
      doc.setTextColor(100, 100, 100)
      doc.text(`Generated on: ${reportData.reportDate}`, 105, 55, { align: "center" })

      // Add horizontal line
      doc.setDrawColor(lightGray[0], lightGray[1], lightGray[2])
      doc.line(20, 60, 190, 60)

      // Add report summary section
      let currentY = 70
      doc.setFontSize(headerFontSize)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text("Report Summary", 20, currentY)
      currentY += 10

      // Add summary boxes
      doc.setFillColor(250, 250, 255)
      doc.roundedRect(20, 75, 50, 25, 2, 2, "F")
      doc.roundedRect(80, 75, 50, 25, 2, 2, "F")
      doc.roundedRect(140, 75, 50, 25, 2, 2, "F")

      // Add summary content
      doc.setFontSize(fontSize)
      doc.setTextColor(100, 100, 100)

      // Box 1
      doc.text("Report Type", 45, 82, { align: "center" })
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(reportData.type, 45, 90, { align: "center" })

      // Box 2
      doc.setTextColor(100, 100, 100)
      doc.text(reportData.type === "User Performance Report" ? "Tests Completed" : "Participants", 105, 82, {
        align: "center",
      })
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(
        reportData.type === "User Performance Report"
          ? reportData.totalTests.toString()
          : reportData.participantCount.toString(),
        105,
        90,
        { align: "center" },
      )

      // Box 3
      doc.setTextColor(100, 100, 100)
      doc.text("Average Score", 165, 82, { align: "center" })
      doc.setTextColor(textColor[0], textColor[1], textColor[2])
      doc.text(`${reportData.averageScore}%`, 165, 90, { align: "center" })

      // Add subject information section
      doc.setFontSize(headerFontSize)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text(reportData.type === "User Performance Report" ? "User Information" : "Test Information", 20, 115)

      // Create a table-like structure with purple headers
      // Table header
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.rect(20, 120, 85, 8, "F")
      doc.rect(105, 120, 85, 8, "F")

      // Header text
      doc.setTextColor(255, 255, 255) // White text for headers
      doc.setFontSize(fontSize)
      doc.text("Attribute", 25, 125)
      doc.text("Value", 110, 125)

      // Table rows
      let yPos = 128
      const rowHeight = 8

      // Set up the data rows
      const detailsData =
        reportData.type === "User Performance Report"
          ? [
              ["Name", reportData.user.username],
              ["Email", reportData.user.email],
              ["Tests Completed", reportData.totalTests.toString()],
              ["Average Score", `${reportData.averageScore}%`],
            ]
          : [
              ["Test Title", reportData.test.title],
              ["Topic", reportData.test.topic],
              ["Participants", reportData.participantCount.toString()],
              ["Average Score", `${reportData.averageScore}%`],
            ]

      // Draw rows with alternating background
      detailsData.forEach((row, index) => {
        // Row background (alternating)
        if (index % 2 === 0) {
          doc.setFillColor(245, 245, 250) // Light purple for even rows
          doc.rect(20, yPos, 85, rowHeight, "F")
          doc.rect(105, yPos, 85, rowHeight, "F")
        }

        // Row text
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.setFontSize(fontSize)
        doc.text(row[0], 25, yPos + 5)
        doc.text(row[1], 110, yPos + 5)

        yPos += rowHeight
      })

      // Track the current Y position
      currentY = yPos + 15

      // Add topic performance section for user reports
      if (reportData.type === "User Performance Report" && reportData.topicPerformance) {
        doc.setFontSize(headerFontSize)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text("Topic Performance", 20, currentY)
        currentY += 10

        // Table header
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(20, currentY, 80, 8, "F") // Topic
        doc.rect(100, currentY, 30, 8, "F") // Score
        doc.rect(130, currentY, 30, 8, "F") // Tests
        doc.rect(160, currentY, 30, 8, "F") // Trend

        // Header text
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(fontSize)
        doc.text("Topic", 25, currentY + 5)
        doc.text("Score", 115, currentY + 5)
        doc.text("Tests", 145, currentY + 5)
        doc.text("Trend", 175, currentY + 5)

        currentY += 8

        // Table rows
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        reportData.topicPerformance.forEach((topic: any, index: number) => {
          // Check if we need a new page
          if (currentY > 260) {
            doc.addPage()
            currentY = 20

            // Add header to new page
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
            doc.rect(20, currentY, 80, 8, "F") // Topic
            doc.rect(100, currentY, 30, 8, "F") // Score
            doc.rect(130, currentY, 30, 8, "F") // Tests
            doc.rect(160, currentY, 30, 8, "F") // Trend

            // Header text
            doc.setTextColor(255, 255, 255)
            doc.setFontSize(fontSize)
            doc.text("Topic", 25, currentY + 5)
            doc.text("Score", 115, currentY + 5)
            doc.text("Tests", 145, currentY + 5)
            doc.text("Trend", 175, currentY + 5)

            currentY += 8
          }

          // Row background
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 250)
            doc.rect(20, currentY, 80, 8, "F")
            doc.rect(100, currentY, 30, 8, "F")
            doc.rect(130, currentY, 30, 8, "F")
            doc.rect(160, currentY, 30, 8, "F")
          }

          // Row text
          doc.setTextColor(textColor[0], textColor[1], textColor[2])
          doc.setFontSize(fontSize)

          // Topic name (truncate if too long)
          const topicName = topic.topic
          const truncatedTopic = topicName.length > 30 ? topicName.substring(0, 27) + "..." : topicName
          doc.text(truncatedTopic, 25, currentY + 5)

          doc.text(`${topic.score}%`, 115, currentY + 5)
          doc.text(topic.tests.toString(), 145, currentY + 5)

          // Trend with color
          if (topic.trend > 0) {
            doc.setTextColor(0, 150, 0) // Green for positive trend
            doc.text(`+${topic.trend}%`, 175, currentY + 5)
          } else if (topic.trend < 0) {
            doc.setTextColor(150, 0, 0) // Red for negative trend
            doc.text(`${topic.trend}%`, 175, currentY + 5)
          } else {
            doc.setTextColor(100, 100, 100) // Gray for no trend
            doc.text("—", 175, currentY + 5)
          }

          currentY += 8
        })

        // Reset text color
        doc.setTextColor(textColor[0], textColor[1], textColor[2])

        // Add some space after the table
        currentY += 10
      }

      // Add score distribution section for test reports
      if (reportData.type === "Test Analysis Report" && reportData.scoreDistribution) {
        // Check if we need a new page
        if (currentY > 230) {
          doc.addPage()
          currentY = 20
        }

        doc.setFontSize(headerFontSize)
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.text("Score Distribution", 20, currentY)
        currentY += 10

        // Table header
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(20, currentY, 80, 8, "F") // Category
        doc.rect(100, currentY, 80, 8, "F") // Count

        // Header text
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(fontSize)
        doc.text("Category", 25, currentY + 5)
        doc.text("Count", 105, currentY + 5)

        currentY += 8

        // Table rows
        const categories = [
          { name: "Excellent (90-100%)", key: "excellent" },
          { name: "Good (70-89%)", key: "good" },
          { name: "Average (50-69%)", key: "average" },
          { name: "Poor (0-49%)", key: "poor" },
        ]

        categories.forEach((category, index) => {
          // Row background
          if (index % 2 === 0) {
            doc.setFillColor(245, 245, 250)
            doc.rect(20, currentY, 80, 8, "F")
            doc.rect(100, currentY, 80, 8, "F")
          }

          // Row text
          doc.setTextColor(textColor[0], textColor[1], textColor[2])
          doc.setFontSize(fontSize)
          doc.text(category.name, 25, currentY + 5)
          doc.text(reportData.scoreDistribution[category.key].toString(), 105, currentY + 5)

          currentY += 8
        })

        // Add some space after the table
        currentY += 10
      }

      // Add AI insights section
      // Check if we need a new page
      if (currentY > 230) {
        doc.addPage()
        currentY = 20
      }

      doc.setFontSize(headerFontSize)
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
      doc.text("AI-Generated Insights", 20, currentY)
      currentY += 10

      // Create a table for AI insights with purple header
      if (reportData.aiInsights) {
        // Table header for insights
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2])
        doc.rect(20, currentY, 170, 8, "F")

        // Header text
        doc.setTextColor(255, 255, 255) // White text for header
        doc.setFontSize(fontSize)
        doc.text("Analysis and Recommendations", 25, currentY + 5)

        currentY += 8

        // Clean up any markdown formatting
        const cleanedAiText = reportData.aiInsights
          .replace(/#+\s/g, "") // Remove heading markers
          .replace(/\*\*/g, "") // Remove bold markers
          .replace(/\*/g, "") // Remove italic markers
          .replace(/`/g, "") // Remove code markers
          .replace(/```/g, "") // Remove code block markers
          .replace(/\d+%/g, "") // Remove percentages

        // Process insights by splitting on numbered points
        const insights = cleanedAiText
          .split(/\d+\.\s+/)
          .filter(Boolean)
          .map((insight) => {
            const parts = insight.split(":")
            if (parts.length > 1) {
              return {
                title: parts[0].trim(),
                content: parts.slice(1).join(":").trim(),
              }
            }
            return {
              title: "Insight",
              content: insight.trim(),
            }
          })

        // Draw each insight
        insights.forEach((insight, index) => {
          // Check if we need a new page
          if (currentY > 260) {
            doc.addPage()
            currentY = 20
          }

          // Background for insight
          doc.setFillColor(250, 250, 255)
          doc.roundedRect(20, currentY, 170, 20, 2, 2, "F")

          // Title
          doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2])
          doc.setFontSize(11)
          doc.text(`${insight.title}`, 25, currentY + 6)

          // Content
          doc.setTextColor(textColor[0], textColor[1], textColor[2])
          doc.setFontSize(fontSize)

          // Split content into lines to fit the width
          const contentLines = doc.splitTextToSize(insight.content, 160)
          doc.text(contentLines, 25, currentY + 12)

          // Adjust height based on content
          const contentHeight = Math.max(20, contentLines.length * 5 + 10)

          // Update Y position for next insight
          currentY += contentHeight + 5
        })
      } else {
        // No AI insights available
        doc.setTextColor(textColor[0], textColor[1], textColor[2])
        doc.setFontSize(fontSize)
        doc.text("No AI insights available for this report.", 20, currentY + 10)
        currentY += 20
      }

      // Add footer
      doc.setFillColor(245, 245, 250) // Light purple background
      doc.rect(0, 280, 210, 17, "F")

      doc.setFontSize(8)
      doc.setTextColor(100, 100, 100)
      doc.text("Generated by SAMAJH AI-Powered Interview Platform", 105, 287, { align: "center" })
      doc.text(`Page 1`, 185, 287)

      // Save the PDF
      const filename = `${reportData.reportTitle.replace(/\s+/g, "_")}.pdf`
      doc.save(filename)

      toast({
        title: "PDF generated successfully",
        description: "Your report has been downloaded.",
      })
    } catch (error: any) {
      console.error("Error generating PDF:", error)
      toast({
        title: "PDF generation failed",
        description: `Error: ${error.message}`,
        variant: "destructive",
      })
    } finally {
      setDownloadingPdf(false)
    }
  }

  const handleReportTypeChange = (value: "performance" | "test" | "") => {
    setReportType(value)
    setSelectedUser("")
    setSelectedTest("")
    setReportData(null)
  }

  const downloadReport = () => {
    downloadPdf()
  }

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
            <p className="text-muted-foreground">Generate and download reports for users and tests.</p>
          </div>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!reportData ? (
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Generate Report</CardTitle>
              <CardDescription>Create detailed reports with AI-powered insights</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="reportType">Report Type</Label>
                <Select
                  value={reportType}
                  onValueChange={(value) => handleReportTypeChange(value as "performance" | "test" | "")}
                >
                  <SelectTrigger className="border-purple-200 focus:border-purple-500">
                    <SelectValue placeholder="Select report type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="performance">User Performance Report</SelectItem>
                    <SelectItem value="test">Test Analysis Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {reportType === "performance" && (
                <div className="space-y-2">
                  <Label htmlFor="user">Select User</Label>
                  <Select value={selectedUser} onValueChange={setSelectedUser} disabled={loading || users.length === 0}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-500">
                      <SelectValue placeholder={loading ? "Loading users..." : "Select a user"} />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.username}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {users.length === 0 && !loading && (
                    <p className="text-sm text-red-500">No users found. Please add users to generate reports.</p>
                  )}
                </div>
              )}

              {reportType === "test" && (
                <div className="space-y-2">
                  <Label htmlFor="test">Select Test</Label>
                  <Select value={selectedTest} onValueChange={setSelectedTest} disabled={loading || tests.length === 0}>
                    <SelectTrigger className="border-purple-200 focus:border-purple-500">
                      <SelectValue placeholder={loading ? "Loading tests..." : "Select a test"} />
                    </SelectTrigger>
                    <SelectContent>
                      {tests.map((test) => (
                        <SelectItem key={test.id} value={test.id}>
                          {test.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {tests.length === 0 && !loading && (
                    <p className="text-sm text-red-500">No tests found. Please add tests to generate reports.</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="period">Time Period</Label>
                <Select value={period} onValueChange={setPeriod}>
                  <SelectTrigger className="border-purple-200 focus:border-purple-500">
                    <SelectValue placeholder="Select time period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last30days">Last 30 Days</SelectItem>
                    <SelectItem value="last3months">Last 3 Months</SelectItem>
                    <SelectItem value="last6months">Last 6 Months</SelectItem>
                    <SelectItem value="lastyear">Last Year</SelectItem>
                    <SelectItem value="alltime">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportTitle">Report Title (Optional)</Label>
                <Input
                  id="reportTitle"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder={
                    reportType === "performance" ? "Performance Report for [User]" : "Analysis Report for [Test]"
                  }
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="reportDescription">Report Description (Optional)</Label>
                <Textarea
                  id="reportDescription"
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="Enter a description for this report"
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button
                onClick={generateReport}
                disabled={
                  loading ||
                  generating ||
                  (reportType === "performance" && !selectedUser) ||
                  (reportType === "test" && !selectedTest)
                }
                className="ml-auto bg-purple-700 hover:bg-purple-800 text-white"
              >
                {generating ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                    Generating Report...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </CardFooter>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* PDF-style Report */}
            <div className="bg-white border border-gray-200 rounded-md shadow-lg max-w-4xl mx-auto">
              {/* Report Header */}
              <div className="p-8 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-purple-800">{reportTitle || reportData.reportTitle}</h2>
                    <p className="text-gray-500 mt-1">{reportDescription || reportData.reportDescription}</p>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Calendar className="h-4 w-4" />
                    <span>{reportData.reportDate}</span>
                  </div>
                </div>
              </div>

              {/* Report Content */}
              <div className="p-8">
                {/* Report Summary */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-purple-800 mb-4">Report Summary</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="border-purple-100">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        {reportData.type === "User Performance Report" ? (
                          <User className="h-8 w-8 text-purple-600 mb-2" />
                        ) : (
                          <FileText className="h-8 w-8 text-purple-600 mb-2" />
                        )}
                        <p className="text-sm text-gray-500">Report Type</p>
                        <p className="font-medium">{reportData.type}</p>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-100">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        {reportData.type === "User Performance Report" ? (
                          <CheckCircle className="h-8 w-8 text-purple-600 mb-2" />
                        ) : (
                          <User className="h-8 w-8 text-purple-600 mb-2" />
                        )}
                        <p className="text-sm text-gray-500">
                          {reportData.type === "User Performance Report" ? "Tests Completed" : "Participants"}
                        </p>
                        <p className="font-medium">
                          {reportData.type === "User Performance Report"
                            ? reportData.totalTests
                            : reportData.participantCount}
                        </p>
                      </CardContent>
                    </Card>

                    <Card className="border-purple-100">
                      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                        <BarChart3 className="h-8 w-8 text-purple-600 mb-2" />
                        <p className="text-sm text-gray-500">Average Score</p>
                        <p className="font-medium">{reportData.averageScore}%</p>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* AI Insights Section */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-4">
                    <Lightbulb className="h-5 w-5 text-purple-800" />
                    <h3 className="text-lg font-semibold text-purple-800">AI-Generated Insights</h3>
                  </div>
                  <Card className="border-purple-100">
                    <CardContent className="p-6">
                      <div className="prose max-w-none">
                        {reportData.aiInsights ? (
                          reportData.aiInsights.startsWith("Failed") ||
                          reportData.aiInsights.startsWith("Gemini API Error") ? (
                            <p className="text-red-500">{reportData.aiInsights}</p>
                          ) : (
                            reportData.aiInsights
                              .split(/\d+\.\s+/)
                              .filter(Boolean)
                              .map((insight, index) => (
                                <div key={index} className="text-gray-700 mb-4">
                                  <p className="text-lg font-medium text-purple-800 mb-2">
                                    {insight.split(":")[0].trim()}
                                  </p>
                                  <p className="text-base">{insight.split(":").slice(1).join(":").trim()}</p>
                                </div>
                              ))
                          )
                        ) : (
                          <p className="text-gray-500">No AI insights available for this report.</p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                variant="outline"
                onClick={() => setReportData(null)}
                className="border-purple-200 text-purple-700"
              >
                Generate Another Report
              </Button>
              <Button
                onClick={downloadReport}
                className="bg-purple-700 hover:bg-purple-800 text-white"
                disabled={downloadingPdf}
              >
                {downloadingPdf ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
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
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
