import { createServerClient } from "../supabase/server"
import type { TestResult } from "../types/database"

export async function getTestResultById(id: string): Promise<TestResult | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("test_results").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching test result:", error)
    return null
  }

  return data as TestResult
}

export async function getTestResultsByUserId(userId: string): Promise<TestResult[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })

  if (error) {
    console.error("Error fetching test results:", error)
    return []
  }

  return data as TestResult[]
}

export async function getTestResultsByTestId(testId: string): Promise<TestResult[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("test_results")
    .select("*")
    .eq("test_id", testId)
    .order("completed_at", { ascending: false })

  if (error) {
    console.error("Error fetching test results:", error)
    return []
  }

  return data as TestResult[]
}

export async function createTestResult(resultData: Omit<TestResult, "id">): Promise<TestResult | null> {
  const supabase = createServerClient()

  // Ensure all required fields have default values
  const processedData = {
    ...resultData,
    tab_switch_attempts: resultData.tab_switch_attempts || 0,
    no_face_violations: resultData.no_face_violations || 0,
    multiple_faces_violations: resultData.multiple_faces_violations || 0,
    face_changed_violations: resultData.face_changed_violations || 0,
    error_count: resultData.error_count || 0,
  }

  const { data, error } = await supabase.from("test_results").insert(processedData).select().single()

  if (error) {
    console.error("Error creating test result:", error)
    return null
  }

  return data as TestResult
}
