import { createClient as createSupabaseClient } from "@supabase/supabase-js"

// Ensure environment variables are available
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing Supabase environment variables. Please check your .env file.")
}

// Export createClient as a named export to satisfy the requirement
export const createClient = (cookieStore?: any) => {
  return createSupabaseClient(supabaseUrl || "", supabaseServiceKey || "", {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
    },
    cookies: cookieStore
      ? {
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
        }
      : undefined,
  })
}

// Instead of creating the client at the module level with cookies(),
// we'll create a basic client without cookies
export const supabaseServer = createSupabaseClient(supabaseUrl || "", supabaseServiceKey || "", {
  auth: {
    autoRefreshToken: true,
    persistSession: false,
  },
})

// For backwards compatibility
export default supabaseServer
