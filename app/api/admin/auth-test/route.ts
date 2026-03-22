import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

/**
 * GET /api/admin/auth-test
 * Debug endpoint to check why admin auth is failing.
 * Remove or protect this after debugging.
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("Authorization")
  const token = authHeader?.startsWith("Bearer ") ? authHeader.split(" ")[1] : null

  if (!token) {
    return NextResponse.json({ ok: false, reason: "No Authorization header or Bearer token found" })
  }

  const result = await verifyAdmin(request)

  if (!result.authenticated) {
    return NextResponse.json({
      ok: false,
      reason: "JWT token invalid or user not found",
      token_prefix: token.slice(0, 20) + "...",
    })
  }

  if (!result.admin) {
    // Fetch the actual profile to show what role we see
    const db = createServiceClient()
    const { data: profile, error } = await db
      .from("user_profiles")
      .select("id, role, full_name, email")
      .eq("id", result.user?.id)
      .single()

    return NextResponse.json({
      ok: false,
      reason: "User is authenticated but not admin",
      user_id: result.user?.id,
      user_email: result.user?.email,
      profile,
      profile_error: error?.message,
    })
  }

  return NextResponse.json({
    ok: true,
    message: "Admin verified successfully",
    user_id: result.user?.id,
    user_email: result.user?.email,
  })
}
