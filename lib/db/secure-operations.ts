import { supabaseServer } from "@/lib/supabase/server"
import type { User } from "@/lib/types"

/**
 * Get a user by email or username, bypassing RLS
 */
export async function getUserByEmailOrUsername(emailOrUsername: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseServer
      .from("users")
      .select("*")
      .or(`email.eq.${emailOrUsername},username.eq.${emailOrUsername}`)
      .single()

    if (error) {
      console.error("Error fetching user by email or username:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserByEmailOrUsername:", error)
    return null
  }
}

/**
 * Update a user's last login timestamp, bypassing RLS
 */
export async function updateUserLastLogin(userId: string): Promise<boolean> {
  try {
    const { error } = await supabaseServer
      .from("users")
      .update({ last_login: new Date().toISOString() })
      .eq("id", userId)

    if (error) {
      console.error("Error updating user last login:", error)
      return false
    }

    return true
  } catch (error) {
    console.error("Error in updateUserLastLogin:", error)
    return false
  }
}

/**
 * Get a user by ID, bypassing RLS
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const { data, error } = await supabaseServer.from("users").select("*").eq("id", userId).single()

    if (error) {
      console.error("Error fetching user by ID:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getUserById:", error)
    return null
  }
}
