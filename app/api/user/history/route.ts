import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { getTestResultsByUserId } from "@/lib/db/secure-result-operations"
import { supabaseServer } from "@/lib/supabase/server"

export async function GET(request: Request) {
  try {
    // Get userId from query params or cookies
    const url = new URL(request.url)
    const userId = url.searchParams.get("userId") || cookies().get("user_id")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("Fetching test history for user:", userId)

    // Get test results for the user
    const results = await getTestResultsByUserId(userId)

    // Log the results for debugging
    console.log(`Found ${results.length} test results for user ${userId}`)

    // If no results are found, try a direct query to debug
    if (results.length === 0) {
      console.log("No results found via secure operations, trying direct query for debugging")
      const { data, error } = await supabaseServer.from("test_results").select("*").eq("user_id", userId)

      if (error) {
        console.error("Direct query error:", error)
      } else {
        console.log(`Direct query found ${data?.length || 0} results`)
      }
    }

    return NextResponse.json({ results })
  } catch (error) {
    console.error("Error fetching test history:", error)
    return NextResponse.json({ error: "Failed to fetch test history" }, { status: 500 })
  }
}
