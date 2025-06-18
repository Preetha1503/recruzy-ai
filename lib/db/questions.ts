import { createServerClient } from "../supabase/server"
import type { Question } from "../types/database"

export async function getQuestionsByTestId(testId: string): Promise<Question[]> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase
      .from("questions")
      .select("*")
      .eq("test_id", testId)
      .order("created_at", { ascending: true })

    if (error) {
      console.error("Error fetching questions:", error)
      return []
    }

    return data as Question[]
  } catch (error) {
    console.error("Error in getQuestionsByTestId:", error)
    return []
  }
}

export async function createQuestion(questionData: Omit<Question, "id" | "created_at">): Promise<Question | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("questions").insert(questionData).select().single()

    if (error) {
      console.error("Error creating question:", error)
      return null
    }

    return data as Question
  } catch (error) {
    console.error("Error in createQuestion:", error)
    return null
  }
}

export async function updateQuestion(id: string, questionData: Partial<Question>): Promise<Question | null> {
  try {
    const supabase = createServerClient()
    const { data, error } = await supabase.from("questions").update(questionData).eq("id", id).select().single()

    if (error) {
      console.error("Error updating question:", error)
      return null
    }

    return data as Question
  } catch (error) {
    console.error("Error in updateQuestion:", error)
    return null
  }
}

export async function deleteQuestion(id: string): Promise<boolean> {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.from("questions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting question:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in deleteQuestion:", error)
    return false
  }
}
