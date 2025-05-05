import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase/server"
import { getRoleFromServerCookies } from "@/lib/server-utils"

export async function POST() {
  try {
    // Check if user is admin
    const role = getRoleFromServerCookies()

    if (role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Create the exec_sql function directly using raw SQL
    const { error } = await supabaseServer.from("_exec_sql").select("*").limit(1)

    if (error) {
      console.log("Table doesn't exist, creating function...")

      // Use raw SQL to create the function
      const { data, error: sqlError } = await supabaseServer.rpc("exec_sql", {
        sql_query: `
          CREATE OR REPLACE FUNCTION exec_sql(sql_query text)
          RETURNS VOID
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            EXECUTE sql_query;
          END;
          $$;
        `,
      })

      if (sqlError) {
        // Try a different approach - create a dummy table first
        const { error: tableError } = await supabaseServer.rpc("exec_sql", {
          sql_query: `CREATE TABLE IF NOT EXISTS _exec_sql (id serial primary key);`,
        })

        if (tableError) {
          console.error("Error creating helper table:", tableError)
          return NextResponse.json({ error: "Failed to create helper function" }, { status: 500 })
        }
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in setup SQL exec:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
