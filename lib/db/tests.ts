import { createServerClient } from "../supabase/server"
import type { Test } from "../types/database"

export async function getTestById(id: string): Promise<Test | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("tests").select("*").eq("id", id).single()

  if (error) {
    console.error("Error fetching test:", error)
    return null
  }

  return data as Test
}

export async function getAllTests(): Promise<Test[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("tests").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching tests:", error)
    return []
  }

  return data as Test[]
}

export async function createTest(testData: Omit<Test, "id" | "created_at" | "updated_at">): Promise<Test | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("tests").insert(testData).select().single()

  if (error) {
    console.error("Error creating test:", error)
    return null
  }

  return data as Test
}

export async function updateTest(id: string, testData: Partial<Test>): Promise<Test | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("tests").update(testData).eq("id", id).select().single()

  if (error) {
    console.error("Error updating test:", error)
    return null
  }

  return data as Test
}

export async function deleteTest(id: string): Promise<boolean> {
  const supabase = createServerClient()
  const { error } = await supabase.from("tests").delete().eq("id", id)

  if (error) {
    console.error("Error deleting test:", error)
    return false
  }

  return true
}
