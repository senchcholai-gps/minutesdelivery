import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// ONE-TIME migration route — DELETE THIS FILE after running
// Visit: http://localhost:3000/api/migrate-profile
// Requires SUPABASE_SERVICE_ROLE_KEY in .env.local

export async function GET() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  if (!serviceKey) {
    return NextResponse.json(
      { error: "Add SUPABASE_SERVICE_ROLE_KEY to .env.local first. Find it in Supabase Dashboard → Settings → API → service_role" },
      { status: 400 }
    );
  }

  const projectRef = url.replace("https://", "").split(".")[0];

  const sql = `
    alter table user_profiles
      add column if not exists full_name text,
      add column if not exists address_line1 text,
      add column if not exists address_line2 text,
      add column if not exists city text,
      add column if not exists state text,
      add column if not exists pincode text;
  `;

  // Try Supabase Management API
  const res = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: sql }),
    }
  );

  if (res.ok) {
    return NextResponse.json({
      success: true,
      message: "✅ Migration done! Columns added to user_profiles. Now delete app/api/migrate-profile/route.ts",
    });
  }

  // Fallback: try with admin supabase client + raw SQL via pg driver isn't available,
  // so return the SQL for manual execution
  const errText = await res.text();
  console.error("[migrate] management API error:", errText);

  return NextResponse.json({
    success: false,
    message: "Management API requires a personal access token, not service_role key. Run this SQL manually:",
    sql,
  });
}
