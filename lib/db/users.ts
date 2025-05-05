import { createServerClient } from "../supabase/server"
import type { User } from "../types/database"

export async function getAllUsers(): Promise<User[]> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("users").select("*").order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching users:", error)
    return []
  }

  return data as User[]
}

export async function getUserById(userId: string): Promise<User | null> {
  const supabase = createServerClient()
  const { data, error } = await supabase.from("users").select("*").eq("id", userId).single()

  if (error) {
    console.error("Error fetching user:", error)
    return null
  }

  return data as User
}
