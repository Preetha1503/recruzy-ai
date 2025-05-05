import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { getRoleFromServerCookies } from "@/lib/server-utils"

export async function GET() {
  try {
    // Check if user is admin
    const role = getRoleFromServerCookies()

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    console.log("Fetching user analytics data...")

    // Fetch all users with role = 'user'
    const { data: users, error: usersError } = await supabaseServer
      .from("users")
      .select("id, username, email, last_login")
      .eq("role", "user")

    if (usersError) {
      console.error("Error fetching users:", usersError)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    // For each user, get test assignment and completion data
    const usersWithAnalytics = await Promise.all(
      users.map(async (user) => {
        // Get assigned tests count
        const { count: assignedTests, error: assignedError } = await supabaseServer
          .from("user_tests")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)

        if (assignedError) {
          console.error(`Error fetching assigned tests for user ${user.id}:`, assignedError)
        }

        // Get completed tests and average score
        const { data: results, error: resultsError } = await supabaseServer
          .from("test_results")
          .select("score")
          .eq("user_id", user.id)

        if (resultsError) {
          console.error(`Error fetching results for user ${user.id}:`, resultsError)
        }

        const completedTests = results?.length || 0
        const totalScore = results?.reduce((sum, result) => sum + (result.score || 0), 0) || 0
        const avgScore = completedTests > 0 ? Math.round(totalScore / completedTests) : 0

        return {
          id: user.id,
          username: user.username,
          email: user.email,
          last_login: user.last_login,
          tests_assigned: assignedTests || 0,
          tests_completed: completedTests,
          avg_score: avgScore,
        }
      }),
    )

    // Calculate active users (logged in within last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const activeUsers = users.filter((user) => user.last_login && user.last_login >= thirtyDaysAgo).length

    console.log("User analytics data:", {
      totalUsers: users.length,
      activeUsers,
      userSample: usersWithAnalytics.slice(0, 2),
    })

    return NextResponse.json({
      data: {
        totalUsers: users.length,
        activeUsers,
        users: usersWithAnalytics,
      },
    })
  } catch (error) {
    console.error("Error in users analytics API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
