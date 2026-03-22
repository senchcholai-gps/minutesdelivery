import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

export async function GET(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const supabaseAdmin = createServiceClient()

    // 1. Get auth users
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 })
    if (authErr) throw authErr

    // 2. Get user profiles
    const { data: profiles, error: profErr } = await supabaseAdmin
      .from("user_profiles")
      .select("*")
    if (profErr) throw profErr

    // 3. Merge them based on ID
    const mergedUsers = authData.users.map(authUser => {
      const profile = profiles.find(p => p.id === authUser.id)
      return {
        id: authUser.id,
        email: authUser.email,
        last_sign_in_at: authUser.last_sign_in_at,
        created_at: authUser.created_at,
        full_name: profile?.full_name || "N/A",
        phone: profile?.phone || "N/A",
        role: profile?.role || "user",
        status: profile?.status || "active",
      }
    })

    const { searchParams } = new URL(request.url)
    const nameFilter = searchParams.get("name")?.toLowerCase()
    const emailFilter = searchParams.get("email")?.toLowerCase()
    const statusFilter = searchParams.get("status")?.toLowerCase()
    const fromDate = searchParams.get("fromDate")
    const toDate = searchParams.get("toDate")

    let filteredUsers = mergedUsers;

    if (nameFilter) {
      filteredUsers = filteredUsers.filter(u => u.full_name.toLowerCase().includes(nameFilter))
    }
    if (emailFilter) {
      filteredUsers = filteredUsers.filter(u => u.email?.toLowerCase().includes(emailFilter))
    }
    if (statusFilter && statusFilter !== "all" && statusFilter !== "") {
      filteredUsers = filteredUsers.filter(u => u.status === statusFilter)
    }
    if (fromDate) {
      filteredUsers = filteredUsers.filter(u => new Date(u.created_at) >= new Date(fromDate))
    }
    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filteredUsers = filteredUsers.filter(u => new Date(u.created_at) <= to)
    }

    // Sort by last login (newest first)
    filteredUsers.sort((a, b) => {
      if (!a.last_sign_in_at) return 1;
      if (!b.last_sign_in_at) return -1;
      return new Date(b.last_sign_in_at).getTime() - new Date(a.last_sign_in_at).getTime();
    })

    return NextResponse.json(filteredUsers)
  } catch (error: any) {
    console.error("Users API Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
