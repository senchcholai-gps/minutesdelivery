import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

async function verifyToken(token: string) {
  const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await c.auth.getUser(token);
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

// ─── PATCH /api/cart/[id] — update variant and/or quantity ───────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAuthedClient(token);
    const body = await request.json();

    const updateData: any = {};
    if (body.quantity !== undefined) {
      if (!Number.isInteger(body.quantity) || body.quantity < 1) {
        return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 });
      }
      updateData.quantity = body.quantity;
    }
    if (body.variant_label !== undefined) {
      updateData.variant_label = body.variant_label;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "No fields to update" }, { status: 400 });
    }

    const { data, error } = await db
      .from("cart")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── DELETE /api/cart/[id] ────────────────────────────────────────────────────
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAuthedClient(token);
    const { error } = await db.from("cart").delete().eq("id", id).eq("user_id", user.id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: "Removed" });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
