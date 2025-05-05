import { supabaseServer } from "@/lib/supabase/server"

/**
 * Get active tests for a user, bypassing RLS
 */
export async function getActiveTestsForUser(userId: string) {
  try {
    console.log(`Getting active tests for user: ${userId}`)

    // Get both assigned specific tests AND published tests
    const { data: assignedTests, error: assignedError } = await supabaseServer
      .from("user_tests")
      .select(`
        id,
        test_id,
        due_date,
        status,
        tests (
          id,
          title,
          description,
          topic,
          duration,
          status,
          created_at
        )
      `)
      .eq("user_id", userId)
      .in("status", ["assigned", "started"])
      .order("due_date", { ascending: true })

    if (assignedError) {
      console.error("Error fetching active tests for user:", assignedError)
      return []
    }

    console.log(`Found ${assignedTests?.length || 0} directly assigned tests`)

    // For debugging - list the test details
    if (assignedTests && assignedTests.length > 0) {
      console.log("Assigned test details:")
      assignedTests.forEach((test) => {
        console.log(`- Test ID: ${test.test_id}, Status: ${test.status}, Test Title: ${test.tests?.title || "Unknown"}`)
      })
    }

    return assignedTests || []
  } catch (error) {
    console.error("Error in getActiveTestsForUser:", error)
    return []
  }
}

/**
 * Get published tests not assigned to user, bypassing RLS
 */
export async function getPublishedTestsNotAssignedToUser(userId: string) {
  try {
    // First get all tests assigned to the user
    const { data: userTests, error: userTestsError } = await supabaseServer
      .from("user_tests")
      .select("test_id")
      .eq("user_id", userId)

    if (userTestsError) {
      console.error("Error fetching user tests:", userTestsError)
      return []
    }

    const assignedTestIds = userTests?.map((ut) => ut.test_id) || []

    // Then get all published tests not in the assigned list
    const { data: publishedTests, error: publishedError } = await supabaseServer
      .from("tests")
      .select("*")
      .eq("status", "published")
      .order("created_at", { ascending: false })

    if (publishedError) {
      console.error("Error fetching published tests:", publishedError)
      return []
    }

    // Filter out tests that are already assigned to the user
    return publishedTests?.filter((test) => !assignedTestIds.includes(test.id)) || []
  } catch (error) {
    console.error("Error in getPublishedTestsNotAssignedToUser:", error)
    return []
  }
}
