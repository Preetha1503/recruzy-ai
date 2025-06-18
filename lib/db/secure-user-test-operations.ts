import { supabaseServer } from "@/lib/supabase/server"

/**
 * Get active tests for a user, bypassing RLS - ONLY ASSIGNED TESTS
 */
export async function getActiveTestsForUser(userId: string) {
  try {
    console.log(`Getting active tests for user: ${userId}`)

    // Get ONLY tests that are specifically assigned to this user
    const { data: assignedTests, error: assignedError } = await supabaseServer
      .from("user_tests")
      .select(`
        id,
        test_id,
        due_date,
        status,
        assigned_at,
        tests!inner (
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
      .eq("tests.status", "published") // Only include published tests
      .order("due_date", { ascending: true })

    if (assignedError) {
      console.error("Error fetching active tests for user:", assignedError)
      return []
    }

    console.log(`Found ${assignedTests?.length || 0} assigned tests for user ${userId}`)

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
 * Check if a user is assigned to a specific test
 */
export async function isUserAssignedToTest(userId: string, testId: string): Promise<boolean> {
  try {
    console.log(`Checking if user ${userId} is assigned to test ${testId}`)

    const { data: assignment, error } = await supabaseServer
      .from("user_tests")
      .select("id")
      .eq("user_id", userId)
      .eq("test_id", testId)
      .eq("status", "assigned")
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - user is not assigned
        console.log(`User ${userId} is NOT assigned to test ${testId}`)
        return false
      }
      console.error("Error checking test assignment:", error)
      return false
    }

    console.log(`User ${userId} IS assigned to test ${testId}`)
    return !!assignment
  } catch (error) {
    console.error("Error in isUserAssignedToTest:", error)
    return false
  }
}

/**
 * Get test assignment details for a user
 */
export async function getUserTestAssignment(userId: string, testId: string) {
  try {
    const { data: assignment, error } = await supabaseServer
      .from("user_tests")
      .select(`
        id,
        test_id,
        user_id,
        due_date,
        status,
        assigned_at,
        started_at,
        completed_at
      `)
      .eq("user_id", userId)
      .eq("test_id", testId)
      .eq("status", "assigned")
      .single()

    if (error) {
      console.error("Error fetching user test assignment:", error)
      return null
    }

    return assignment
  } catch (error) {
    console.error("Error in getUserTestAssignment:", error)
    return null
  }
}

/**
 * This function is no longer used - we don't show unassigned published tests
 */
export async function getPublishedTestsNotAssignedToUser(userId: string) {
  // Return empty array since we only show assigned tests now
  return []
}
