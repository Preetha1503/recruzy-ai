import { createClient } from "@supabase/supabase-js"
import supabase from "./client"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Helper function to determine if we're on the client
const isClient = typeof window !== "undefined"

// Get the appropriate Supabase client based on the context
export function getSupabaseClient(cookieStore?: any) {
  // If we're on the client, use the client-side Supabase client
  if (isClient) {
    return supabase
  }

  // If we're on the server, create a new client with the cookie store
  return createClient(supabaseUrl, supabaseAnonKey, {
    cookies: cookieStore
      ? {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            cookieStore.set({ name, value, ...options })
          },
          remove(name: string, options: any) {
            cookieStore.delete({ name, ...options })
          },
        }
      : undefined,
  })
}
