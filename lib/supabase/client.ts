import { createClient } from "@supabase/supabase-js"

// Use environment variables safely for client-side
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ""
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""

// Create a Supabase client for client-side operations
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Also export as default for backward compatibility
export default supabase

// Create a client-safe version of supabaseServer that doesn't use next/headers
export const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
  },
})
