import { createServerClient } from "../supabase/server"
import type { UserTest } from "../types/database"

export async function getUserTestsByUserId(userId: string): Promise<UserTest[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase
    .from("user_tests")
    .select("*")
    .eq("user_id", userId)
    .order("assigned_at", { ascending: false })

  if (error) {
    console.error("Error fetching user tests:", error)
    return []
  }

  return data as UserTest[]
}

export async function assignTestToUser(userTestData: Omit<UserTest, "id">): Promise<UserTest | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("user_tests").insert(userTestData).select().single()

  if (error) {
    console.error("Error assigning test to user:", error)
    return null
  }

  return data as UserTest
}

export async function updateUserTestStatus(id: string, status: UserTest["status"]): Promise<UserTest | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("user_tests").update({ status }).eq("id", id).select().single()

  if (error) {
    console.error("Error updating user test status:", error)
    return null
  }

  return data as UserTest
}
