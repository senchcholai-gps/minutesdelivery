import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Category-name keyword → default variants (with realistic prices)
const DEFAULT_VARIANTS_BY_CATEGORY: Record<string, Array<{ label: string; price: number }>> = {
  chicken: [{ label: "500g", price: 150 }, { label: "1kg", price: 300 }],
  marinated: [{ label: "500g", price: 180 }, { label: "1kg", price: 360 }],
  "sea fish": [{ label: "1kg", price: 350 }],
  "dam fish": [{ label: "1kg", price: 280 }],
  fish: [{ label: "1kg", price: 300 }],
};

function pickDefaultVariants(categoryName: string) {
  const lower = (categoryName || "").toLowerCase();
  for (const [key, val] of Object.entries(DEFAULT_VARIANTS_BY_CATEGORY)) {
    if (lower.includes(key)) return val;
  }
  return [{ label: "1kg", price: 250 }];
}

// GET /api/admin/seed-variants — CALL THIS ONCE TO POPULATE ALL EMPTY PRODUCTS
export async function GET(request: Request) {
  // Basic secret guard — add ?secret=seed to the URL
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== "seed") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // 1. Fetch all products with their category name
  const { data: products, error } = await db
    .from("products")
    .select("id, name, variant_options, categories ( name )");

  if (error || !products) {
    return NextResponse.json({ error: error?.message || "Failed" }, { status: 500 });
  }

  // 2. Update only products that have no variant_options
  const toUpdate = products.filter(
    (p: any) => !Array.isArray(p.variant_options) || p.variant_options.length === 0
  );

  const results: any[] = [];
  for (const p of toUpdate) {
    const categoryName = (p as any).categories?.name || "";
    const variants = pickDefaultVariants(categoryName);

    const { error: updateError } = await db
      .from("products")
      .update({ variant_options: variants })
      .eq("id", p.id);

    results.push({
      id: p.id,
      name: p.name,
      category: categoryName,
      variants,
      success: !updateError,
      error: updateError?.message,
    });
  }

  return NextResponse.json({
    seeded: results.length,
    skipped: products.length - results.length,
    results,
  });
}
