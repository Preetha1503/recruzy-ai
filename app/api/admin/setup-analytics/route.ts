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

    // Create the get_table_columns function if it doesn't exist
    const { error } = await supabaseServer.rpc("create_get_table_columns_function")

    if (error) {
      // Function might already exist or there's another issue
      console.log("Creating function error (might already exist):", error)

      // Create the function directly
      const { error: createError } = await supabaseServer.rpc("exec_sql", {
        sql_query: `
          CREATE OR REPLACE FUNCTION get_table_columns(table_name text)
          RETURNS TABLE(column_name text, data_type text)
          LANGUAGE plpgsql
          SECURITY DEFINER
          AS $$
          BEGIN
            RETURN QUERY
            SELECT c.column_name::text, c.data_type::text
            FROM information_schema.columns c
            WHERE c.table_name = table_name
            AND c.table_schema = 'public';
          END;
          $$;
        `,
      })

      if (createError) {
        console.error("Error creating function directly:", createError)
        return NextResponse.json({ error: "Failed to create helper function" }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in setup analytics:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
