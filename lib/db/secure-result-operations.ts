import { supabaseServer } from "@/lib/supabase/server"
import type { TestResult } from "@/lib/types"

export async function getTestResultsByUserId(userId: string): Promise<TestResult[]> {
  try {
    const { data, error } = await supabaseServer
      .from("test_results")
      .select(`
        *,
        tests(
          id,
          title,
          topic,
          description,
          duration
        )
      `)
      .eq("user_id", userId)
      .order("completed_at", { ascending: false })

    if (error) {
      console.error("Error fetching test results:", error)
      throw new Error(`Failed to fetch test results: ${error.message}`)
    }

    // Ensure all fields have default values if they're missing
    const processedResults = data.map((result) => ({
      ...result,
      tab_switch_attempts: result.tab_switch_attempts || 0,
      no_face_violations: result.no_face_violations || 0,
      multiple_faces_violations: result.multiple_faces_violations || 0,
      face_changed_violations: result.face_changed_violations || 0,
      error_count: result.error_count || 0,
      client_errors: result.client_errors || [],
      answers: result.answers || {},
    }))

    return processedResults
  } catch (error) {
    console.error("Error in getTestResultsByUserId:", error)
    return []
  }
}

export async function getTestResultById(resultId: string): Promise<TestResult | null> {
  try {
    const { data, error } = await supabaseServer
      .from("test_results")
      .select(`
        *,
        tests(
          id,
          title,
          topic,
          description,
          duration
        )
      `)
      .eq("id", resultId)
      .single()

    if (error) {
      console.error("Error fetching test result:", error)
      throw new Error(`Failed to fetch test result: ${error.message}`)
    }

    if (!data) {
      return null
    }

    // Ensure all fields have default values if they're missing
    const processedResult = {
      ...data,
      tab_switch_attempts: data.tab_switch_attempts || 0,
      no_face_violations: data.no_face_violations || 0,
      multiple_faces_violations: data.multiple_faces_violations || 0,
      face_changed_violations: data.face_changed_violations || 0,
      error_count: data.error_count || 0,
      client_errors: data.client_errors || [],
      answers: data.answers || {},
    }

    return processedResult
  } catch (error) {
    console.error("Error in getTestResultById:", error)
    return null
  }
}

export async function getTestResultsForTest(testId: string): Promise<TestResult[]> {
  try {
    const { data, error } = await supabaseServer
      .from("test_results")
      .select(`
        *,
        tests(
          id,
          title,
          topic,
          description,
          duration
        )
      `)
      .eq("test_id", testId)
      .order("completed_at", { ascending: false })

    if (error) {
      console.error("Error fetching test results for test:", error)
      throw new Error(`Failed to fetch test results for test: ${error.message}`)
    }

    // Ensure all fields have default values if they're missing
    const processedResults = data.map((result) => ({
      ...result,
      tab_switch_attempts: result.tab_switch_attempts || 0,
      no_face_violations: result.no_face_violations || 0,
      multiple_faces_violations: result.multiple_faces_violations || 0,
      face_changed_violations: result.face_changed_violations || 0,
      error_count: result.error_count || 0,
      client_errors: result.client_errors || [],
      answers: result.answers || {},
    }))

    return processedResults
  } catch (error) {
    console.error("Error in getTestResultsForTest:", error)
    return []
  }
}
