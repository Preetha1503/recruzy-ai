import { type NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    console.log("=== ADMIN ANALYTICS API - START ===")
    const period = request.nextUrl.searchParams.get("period") || "last6months"
    console.log("Requested period:", period)

    // Get date range based on period
    const endDate = new Date()
    let startDate = new Date()

    switch (period) {
      case "last30days":
        startDate.setDate(startDate.getDate() - 30)
        break
      case "last3months":
        startDate.setMonth(startDate.getMonth() - 3)
        break
      case "last6months":
        startDate.setMonth(startDate.getMonth() - 6)
        break
      case "lastyear":
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case "alltime":
        startDate = new Date(0) // Beginning of time
        break
    }

    // Format dates for Supabase query
    const startDateStr = startDate.toISOString()
    const endDateStr = endDate.toISOString()
    console.log("Date range:", { startDate: startDateStr, endDate: endDateStr })

    // Fetch test results within the date range - changed created_at to completed_at
    console.log("Executing query: test_results with date range and joins")
    const { data: testResults, error: resultsError } = await supabaseServer
      .from("test_results")
      .select(`
       id,
       score,
       completed_at,
       user_id,
       test_id,
       users (username),
       tests (title, topic)
     `)
      .gte("completed_at", startDateStr)
      .lte("completed_at", endDateStr)
      .order("completed_at", { ascending: true })

    if (resultsError) {
      console.error("Error fetching test results:", resultsError)
      throw new Error("Failed to fetch test results")
    }

    console.log(`Retrieved ${testResults?.length || 0} test results`)

    // Process performance data (average scores by month)
    console.log("Processing performance data by month")
    const performanceByMonth: Record<string, { total: number; count: number }> = {}

    testResults?.forEach((result) => {
      const date = new Date(result.completed_at)
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`

      if (!performanceByMonth[monthYear]) {
        performanceByMonth[monthYear] = { total: 0, count: 0 }
      }

      performanceByMonth[monthYear].total += result.score
      performanceByMonth[monthYear].count += 1
    })

    const performanceData = Object.entries(performanceByMonth).map(([month, data]) => ({
      month,
      score: Math.round(data.total / data.count),
    }))

    console.log("Performance data processed:", performanceData)

    // Process participation data (test count by month)
    console.log("Processing participation data by month")
    const participationByMonth: Record<string, number> = {}

    testResults?.forEach((result) => {
      const date = new Date(result.completed_at)
      const monthYear = `${date.toLocaleString("default", { month: "short" })} ${date.getFullYear()}`

      if (!participationByMonth[monthYear]) {
        participationByMonth[monthYear] = 0
      }

      participationByMonth[monthYear] += 1
    })

    const participationData = Object.entries(participationByMonth).map(([month, count]) => ({
      month,
      count,
    }))

    console.log("Participation data processed:", participationData)

    // Calculate max participants for scaling the chart
    const maxParticipants = Math.max(...Object.values(participationByMonth), 1)

    // Calculate score change percentage
    let scoreChange = "0%"
    if (performanceData.length >= 2) {
      const firstScore = performanceData[0].score
      const lastScore = performanceData[performanceData.length - 1].score
      const change = Math.round(((lastScore - firstScore) / Math.max(firstScore, 1)) * 100)
      scoreChange = `${change > 0 ? "+" : ""}${change}%`
      console.log("Score change calculated:", scoreChange, `(${firstScore} → ${lastScore})`)
    }

    // Calculate current average score
    const currentAverage = performanceData.length > 0 ? `${performanceData[performanceData.length - 1].score}%` : "0%"
    console.log("Current average score:", currentAverage)

    // Calculate participation change percentage
    let participationChange = "0%"
    if (participationData.length >= 2) {
      const firstCount = participationData[0].count
      const lastCount = participationData[participationData.length - 1].count
      const change = Math.round(((lastCount - firstCount) / Math.max(firstCount, 1)) * 100)
      participationChange = `${change > 0 ? "+" : ""}${change}%`
      console.log("Participation change calculated:", participationChange, `(${firstCount} → ${lastCount})`)
    }

    // Calculate total participants
    const totalParticipants = testResults?.length || 0
    console.log("Total participants:", totalParticipants)

    // Process top performers
    console.log("Processing top performers")
    const userScores: Record<string, { total: number; count: number; name: string; tests: number }> = {}

    testResults?.forEach((result) => {
      const userId = result.user_id
      const username = result.users?.username || "Unknown User"

      if (!userScores[userId]) {
        userScores[userId] = { total: 0, count: 0, name: username, tests: 0 }
      }

      userScores[userId].total += result.score
      userScores[userId].count += 1
      userScores[userId].tests += 1
    })

    const topPerformers = Object.entries(userScores)
      .map(([userId, data]) => ({
        id: userId,
        name: data.name,
        score: `${Math.round(data.total / data.count)}%`,
        tests: data.tests,
      }))
      .sort((a, b) => Number.parseInt(b.score) - Number.parseInt(a.score))
      .slice(0, 5)

    console.log("Top performers processed:", topPerformers)

    // Process test performance
    console.log("Processing test performance")
    const testScores: Record<string, { total: number; count: number; name: string }> = {}

    testResults?.forEach((result) => {
      const testId = result.test_id
      const testName = result.tests?.title || "Unknown Test"

      if (!testScores[testId]) {
        testScores[testId] = { total: 0, count: 0, name: testName }
      }

      testScores[testId].total += result.score
      testScores[testId].count += 1
    })

    const testPerformance = Object.entries(testScores)
      .map(([testId, data]) => ({
        id: testId,
        name: data.name,
        avgScore: `${Math.round(data.total / data.count)}%`,
        participants: data.count,
      }))
      .sort((a, b) => Number.parseInt(b.avgScore) - Number.parseInt(a.avgScore))
      .slice(0, 5)

    console.log("Test performance processed:", testPerformance)
    console.log("=== ADMIN ANALYTICS API - COMPLETE ===")

    return NextResponse.json({
      performanceData,
      participationData,
      topPerformers,
      testPerformance,
      scoreChange,
      currentAverage,
      participationChange,
      totalParticipants,
      maxParticipants,
    })
  } catch (error) {
    console.error("Error in analytics API:", error)
    return NextResponse.json({ error: "Failed to fetch analytics data" }, { status: 500 })
  }
}
