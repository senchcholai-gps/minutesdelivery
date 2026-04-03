import { createClient } from "@supabase/supabase-js"
import { supabase } from "./supabaseClient"

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Creates a Supabase service role client for operations that need to bypass RLS.
 * Use only in server-side code (API routes).
 */
export function createServiceClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured")
  return createClient(SUPABASE_URL, serviceKey)
}

/**
 * CLIENT-SIDE: checks if the current user has the "admin" role.
 * Uses the sync-role API (service key) instead of a direct query to avoid RLS 406 errors.
 */
export async function isAdmin() {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session?.access_token) return false

  try {
    const res = await fetch("/api/auth/sync-role", {
      method: "POST",
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!res.ok) return false
    const data = await res.json()
    return data.role === "admin"
  } catch {
    return false
  }
}

/**
 * SERVER-SIDE helper for API Route Handlers.
 *
 * 1. Extract Bearer token from Authorization header
 * 2. Create a token-scoped Supabase client
 * 3. Validate the user via getUser()
 * 4. Use the SERVICE ROLE client to read user_profiles (bypasses RLS)
 */
export async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null

  if (!token || token === "undefined" || token === "null" || token.length < 20) {
    console.warn("[AdminAuth] No valid token in request headers.")
    return { authenticated: false, admin: false, user: null }
  }

  try {
    // Step 1: Validate the JWT token by creating a token-scoped client
    const authedClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    const { data: { user }, error: authError } = await authedClient.auth.getUser()
    if (authError || !user) {
      console.error("[AdminAuth] Invalid token or no user:", authError?.message)
      return { authenticated: false, admin: false, user: null }
    }

    // Step 2: Use the SERVICE ROLE client to read the user's profile.
    // This is critical — if user_profiles has RLS, the anon client may be blocked.
    const serviceClient = createServiceClient()
    const { data: profile, error: profileError } = await serviceClient
      .from("user_profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error("[AdminAuth] Profile read failed:", profileError.message, "| Code:", profileError.code)
      return { authenticated: true, admin: false, user }
    }

    if (!profile) {
      console.warn("[AdminAuth] No profile found for user:", user.id)
      return { authenticated: true, admin: false, user }
    }

    if (profile.role !== "admin") {
      console.warn("[AdminAuth] Not admin. Role is:", profile.role, "| User:", user.id)
      return { authenticated: true, admin: false, user }
    }

    return { authenticated: true, admin: true, user }
  } catch (err: any) {
    console.error("[AdminAuth] Critical error:", err.message)
    return { authenticated: false, admin: false, user: null }
  }
}
