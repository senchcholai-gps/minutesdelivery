import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function verifyToken(token: string) {
  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await client.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

function createAuthedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function getToken(request: Request): string | null {
  return request.headers.get("Authorization")?.replace("Bearer ", "").trim() || null;
}

// GET /api/profile
export async function GET(request: Request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAuthedClient(token);
    const { data, error } = await db
      .from("user_profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (error) {
      console.error("[profile GET] error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return empty object if no profile yet (not a 404 error)
    return NextResponse.json(data ?? {});
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/profile  (create or update)
export async function POST(request: Request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAuthedClient(token);
    const body = await request.json();
    const { full_name, phone, address_line1, address_line2, city, district, state, pincode } = body;

    const { data, error } = await db
      .from("user_profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name,
        phone,
        address_line1,
        address_line2,
        city,
        district,
        state,
        pincode,
      })
      .select()
      .single();

    if (error) {
      console.error("[profile POST] error:", JSON.stringify(error));
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
