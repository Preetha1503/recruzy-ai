import { DashboardLayout } from "@/components/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart3, ClipboardList, Users } from "lucide-react"
import { cookies } from "next/headers"
import { createServerClient } from "@/lib/supabase/server"

async function getStats() {
  const userId = cookies().get("user_id")?.value

  if (!userId) {
    return {
      interviewsConducted: 0,
      attendees: 0,
      testsCreated: 0,
      recentTests: [],
      topUsers: [],
    }
  }

  try {
    // Create a server client with admin privileges to bypass RLS
    const cookieStore = cookies()
    const supabase = createServerClient(cookieStore)

    // Get tests created by admin
    const { data: tests, error: testsError } = await supabase.from("tests").select("*").eq("created_by", userId)

    if (testsError) {
      console.error("Error fetching tests:", testsError)
      return {
        interviewsConducted: 0,
        attendees: 0,
        testsCreated: tests?.length || 0,
        recentTests: [],
        topUsers: [],
      }
    }

    // If no tests, return early with zeros
    if (!tests || tests.length === 0) {
      return {
        interviewsConducted: 0,
        attendees: 0,
        testsCreated: 0,
        recentTests: [],
        topUsers: [],
      }
    }

    // Get test IDs for further queries
    const testIds = tests.map((t) => t.id)

    // Get completed tests count - with error handling
    let completedCount = 0
    try {
      const { count, error: completedError } = await supabase
        .from("test_results")
        .select("*", { count: "exact", head: true })
        .in("test_id", testIds)

      if (!completedError) {
        completedCount = count || 0
      } else {
        console.error("Error fetching completed tests:", completedError)
      }
    } catch (err) {
      console.error("Exception in completed tests query:", err)
    }

    // Get unique attendees - with error handling
    let uniqueAttendees = 0
    try {
      const { data: attendees, error: attendeesError } = await supabase
        .from("test_results")
        .select("user_id")
        .in("test_id", testIds)

      if (!attendeesError && attendees) {
        uniqueAttendees = new Set(attendees.map((a) => a.user_id)).size
      } else {
        console.error("Error fetching attendees:", attendeesError)
      }
    } catch (err) {
      console.error("Exception in attendees query:", err)
    }

    // Get recent tests - with error handling
    let recentTestsData = []
    try {
      const { data: recentTests, error: recentError } = await supabase
        .from("tests")
        .select(`
          id,
          title,
          created_at,
          user_tests (
            id
          )
        `)
        .eq("created_by", userId)
        .order("created_at", { ascending: false })
        .limit(3)

      if (!recentError && recentTests) {
        recentTestsData = recentTests.map((test) => ({
          name: test.title,
          date: new Date(test.created_at).toLocaleDateString(),
          participants: test.user_tests?.length || 0,
        }))
      } else {
        console.error("Error fetching recent tests:", recentError)
      }
    } catch (err) {
      console.error("Exception in recent tests query:", err)
    }

    // Get top performing users - with error handling
    let topUsersData = []
    try {
      const { data: topUsers, error: topError } = await supabase
        .from("test_results")
        .select(`
          score,
          users (
            id,
            username
          ),
          test_id
        `)
        .in("test_id", testIds)
        .order("score", { ascending: false })
        .limit(3)

      if (!topError && topUsers) {
        topUsersData = topUsers.map((result) => ({
          name: result.users?.username || "Unknown",
          score: `${result.score}%`,
          tests: 1, // This is simplified, in a real app you'd count tests per user
        }))
      } else {
        console.error("Error fetching top users:", topError)
      }
    } catch (err) {
      console.error("Exception in top users query:", err)
    }

    return {
      interviewsConducted: completedCount,
      attendees: uniqueAttendees,
      testsCreated: tests.length,
      recentTests: recentTestsData,
      topUsers: topUsersData,
    }
  } catch (err) {
    console.error("Error in getStats:", err)
    return {
      interviewsConducted: 0,
      attendees: 0,
      testsCreated: 0,
      recentTests: [],
      topUsers: [],
    }
  }
}

export default async function AdminDashboard() {
  const stats = await getStats()

  return (
    <DashboardLayout requiredRole="admin">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-purple-800">Admin Dashboard</h1>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">Interviews Conducted</CardTitle>
              <BarChart3 className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{stats.interviewsConducted}</div>
              <p className="text-xs text-gray-500 mt-1">Total completed interviews</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">Total Attendees</CardTitle>
              <Users className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{stats.attendees}</div>
              <p className="text-xs text-gray-500 mt-1">Unique participants</p>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-gray-500">Tests Created</CardTitle>
              <ClipboardList className="h-5 w-5 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-800">{stats.testsCreated}</div>
              <p className="text-xs text-gray-500 mt-1">Total tests in system</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Recent Tests</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.recentTests.length > 0 ? (
                  stats.recentTests.map((test, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-purple-100 pb-2">
                      <div>
                        <p className="font-medium text-purple-700">{test.name}</p>
                        <p className="text-xs text-gray-500">{test.date}</p>
                      </div>
                      <div className="text-sm text-purple-600">{test.participants} participants</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No tests created yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200">
            <CardHeader>
              <CardTitle className="text-xl text-purple-800">Top Performing Users</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.topUsers.length > 0 ? (
                  stats.topUsers.map((user, i) => (
                    <div key={i} className="flex items-center justify-between border-b border-purple-100 pb-2">
                      <div>
                        <p className="font-medium text-purple-700">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.tests} tests completed</p>
                      </div>
                      <div className="text-sm font-medium text-green-600">{user.score}</div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500">No test results yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
