import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function createAuthedClient(token: string) {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

function getToken(request: Request): string | null {
  return request.headers.get("Authorization")?.replace("Bearer ", "").trim() || null;
}

async function verifyToken(token: string) {
  const c = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  const { data: { user }, error } = await c.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

// ─── GET /api/cart ─────────────────────────────────────────────────────────────
export async function GET(request: Request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAuthedClient(token);

    const { data: cartItems, error: cartError } = await db
      .from("cart")
      .select("id, user_id, product_id, variant_label, quantity, created_at")
      .eq("user_id", user.id);

    if (cartError) return NextResponse.json({ error: cartError.message }, { status: 500 });
    if (!cartItems || cartItems.length === 0) return NextResponse.json([]);

    const productIds = [...new Set(cartItems.map((i: any) => i.product_id))];
    const { data: products, error: productsError } = await db
      .from("products")
      .select("id, name, image, category_id, delivery_charge, variant_options, stock, availability, categories ( name )")
      .in("id", productIds);

    if (productsError) return NextResponse.json({ error: productsError.message }, { status: 500 });

    // Category-based default variants (mirrors products GET logic)
    const DEFAULT_VARIANTS: Record<string, Array<{ label: string; price: number }>> = {
      chicken: [{ label: "500g", price: 150 }, { label: "1kg", price: 300 }],
      marinated: [{ label: "500g", price: 180 }, { label: "1kg", price: 360 }],
      "sea fish": [{ label: "1kg", price: 350 }],
      "dam fish": [{ label: "1kg", price: 280 }],
      fish: [{ label: "1kg", price: 300 }],
    };

    function resolveVariants(p: any): Array<{ label: string; price: number }> {
      if (Array.isArray(p?.variant_options) && p.variant_options.length > 0) return p.variant_options;
      const catName = ((p as any).categories?.name || "").toLowerCase();
      for (const [key, val] of Object.entries(DEFAULT_VARIANTS)) {
        if (catName.includes(key)) return val;
      }
      return [];
    }

    const productMap = Object.fromEntries((products ?? []).map((p: any) => [p.id, p]));

    const merged = cartItems.map((item: any) => {
      const product = productMap[item.product_id] ?? null;
      const variants = resolveVariants(product);
      const variant = variants.find((v: any) => v.label === item.variant_label);
      return {
        ...item,
        products: { ...product, variant_options: variants },
        unit_price: variant?.price ?? 0,
      };
    });

    return NextResponse.json(merged);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ─── POST /api/cart ────────────────────────────────────────────────────────────
export async function POST(request: Request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await verifyToken(token);
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const db = createAuthedClient(token);
    const body = await request.json();
    const { product_id, variant_label, quantity = 1 } = body;

    if (!product_id) return NextResponse.json({ error: "product_id is required" }, { status: 400 });
    if (!variant_label) return NextResponse.json({ error: "variant_label is required" }, { status: 400 });
    if (!Number.isInteger(quantity) || quantity < 1) {
      return NextResponse.json({ error: "quantity must be a positive integer" }, { status: 400 });
    }

    // Upsert: same product+variant combo increments quantity
    const { data: existing } = await db
      .from("cart")
      .select("id, quantity")
      .eq("user_id", user.id)
      .eq("product_id", product_id)
      .eq("variant_label", variant_label)
      .maybeSingle();

    if (existing) {
      const { data, error } = await db
        .from("cart")
        .update({ quantity: existing.quantity + quantity })
        .eq("id", existing.id)
        .select()
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json(data);
    }

    const { data, error } = await db
      .from("cart")
      .insert([{ user_id: user.id, product_id, variant_label, quantity }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
