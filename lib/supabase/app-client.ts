import { createClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a Supabase client for server-side operations in the App Router
export const createServerClient = () => {
  try {
    const cookieStore = cookies()
    return createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (e) {
            console.warn("Failed to set cookie in server:", e)
          }
        },
        remove(name: string, options: any) {
          try {
            cookieStore.delete({ name, ...options })
          } catch (e) {
            console.warn("Failed to remove cookie in server:", e)
          }
        },
      },
    })
  } catch (error) {
    console.error("Error creating server client:", error)
    throw error
  }
}
