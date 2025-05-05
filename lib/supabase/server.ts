import { createClient } from "@supabase/supabase-js"
import type { CookieOptions } from "@supabase/supabase-js"

// Ensure environment variables are available
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  ""

// Create a server-side Supabase client without using next/headers
export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
})

// For backwards compatibility
export default supabaseServer

// Export a function to create a client with cookies if needed
export const createServerClient = (cookieStore?: any) => {
  if (!cookieStore) {
    return supabaseServer
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value || null
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options })
        } catch (e) {
          console.warn("Failed to set cookie in server:", e)
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.delete({ name, ...options })
        } catch (e) {
          console.warn("Failed to remove cookie in server:", e)
        }
      },
    },
  })
}
