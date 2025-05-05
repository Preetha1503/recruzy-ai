import { supabaseServer } from "@/lib/supabase/server"
import type { Test, Question, TestWithQuestions } from "@/lib/types"

// Update the getAllTests function to directly query the database instead of using RPC
export async function getAllTests(): Promise<Test[]> {
  try {
    console.log("Fetching all tests from secure operation")

    // Direct query instead of RPC
    const { data, error } = await supabaseServer.from("tests").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching all tests:", error)
      return []
    }

    console.log(`Retrieved ${data?.length || 0} tests from database`)
    return data || []
  } catch (error) {
    console.error("Error in getAllTests:", error)
    return []
  }
}

/**
 * Get tests by user ID, bypassing RLS
 */
export async function getTestsByUserId(userId: string): Promise<Test[]> {
  try {
    // Direct query instead of RPC
    const { data, error } = await supabaseServer
      .from("tests")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching tests by user ID:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getTestsByUserId:", error)
    return []
  }
}

/**
 * Get test by ID, bypassing RLS
 */
export async function getTestById(testId: string): Promise<Test | null> {
  try {
    // Direct query instead of RPC
    const { data, error } = await supabaseServer.from("tests").select("*").eq("id", testId).single()

    if (error) {
      console.error("Error fetching test by ID:", error)
      return null
    }

    return data || null
  } catch (error) {
    console.error("Error in getTestById:", error)
    return null
  }
}

/**
 * Get questions by test ID, bypassing RLS
 */
export async function getQuestionsByTestId(testId: string): Promise<Question[]> {
  try {
    // Direct query instead of RPC
    const { data, error } = await supabaseServer
      .from("questions")
      .select("*")
      .eq("test_id", testId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching questions by test ID:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getQuestionsByTestId:", error)
    return []
  }
}

/**
 * Get test with questions, bypassing RLS
 */
export async function getTestWithQuestions(testId: string): Promise<TestWithQuestions | null> {
  try {
    const test = await getTestById(testId)
    if (!test) return null

    const questions = await getQuestionsByTestId(testId)

    return {
      ...test,
      questions,
    }
  } catch (error) {
    console.error("Error in getTestWithQuestions:", error)
    return null
  }
}
