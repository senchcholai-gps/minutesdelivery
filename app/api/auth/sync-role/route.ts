import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * Emails that should receive the "admin" role automatically.
 * Add or remove emails here — role is re-synced on every login.
 */
const ADMIN_EMAILS = [
  "senchcholaigps@gmail.com",
  "minutesdeliverysm@gmail.com",
]

/**
 * POST /api/auth/sync-role
 *
 * Called by AuthContext after every successful login.
 * Validates the JWT token, determines the correct role for the user's email,
 * and upserts their user_profiles row with that role.
 *
 * Role assignment is ALWAYS done server-side — the frontend never assigns roles.
 */
export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("Authorization")
    const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // 1. Validate the token — get the real user from Supabase auth
    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })
    const { data: { user }, error: authError } = await authedClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }

    // 2. Determine role from email (server-side only — never trust the frontend)
    const email = user.email?.toLowerCase().trim() ?? ""
    const role = ADMIN_EMAILS.map(e => e.toLowerCase()).includes(email) ? "admin" : "user"

    // 3. Update or Insert user_profiles using service role client (bypasses RLS)
    const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    // Check if profile exists by email (maybeSingle avoids 406 when no row exists)
    const { data: existingUser } = await serviceClient
      .from("user_profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle()

    let dbError

    if (existingUser) {
      // Update by email
      const { error } = await serviceClient
        .from("user_profiles")
        .update({ role })
        .eq("email", email)
      dbError = error
    } else {
      // Insert new profile
      const { error } = await serviceClient
        .from("user_profiles")
        .insert({
          id: user.id, // keep id for completeness but rely on email for relation
          email,
          role,
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || null
        })
      dbError = error
    }

    if (dbError) {
      console.error("[sync-role] db error:", dbError.message)
      return NextResponse.json({ error: dbError.message }, { status: 500 })
    }

    console.log(`[sync-role] ✅ ${email} → role=${role}`)
    return NextResponse.json({ role })
  } catch (err: any) {
    console.error("[sync-role] critical:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
