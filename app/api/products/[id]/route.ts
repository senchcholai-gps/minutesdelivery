import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

const DEFAULT_VARIANTS: Record<string, Array<{ label: string; price: number }>> = {
  chicken: [{ label: "500g", price: 150 }, { label: "1kg", price: 300 }],
  marinated: [{ label: "500g", price: 180 }, { label: "1kg", price: 360 }],
  "sea fish": [{ label: "1kg", price: 350 }],
  "dam fish": [{ label: "1kg", price: 280 }],
  fish: [{ label: "1kg", price: 300 }],
};

function getDefaultVariants(categoryName: string) {
  const lower = (categoryName || "").toLowerCase();
  for (const [key, val] of Object.entries(DEFAULT_VARIANTS)) {
    if (lower.includes(key)) return val;
  }
  return [];
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { data, error } = await supabase
      .from("products")
      .select("*, categories ( id, name )")
      .or(`id.eq.${id},slug.eq.${id}`);

    if (error || !data || data.length === 0) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const p = data[0];
    const variants = Array.isArray(p.variant_options) && p.variant_options.length > 0
      ? p.variant_options
      : getDefaultVariants(p.categories?.name || "");

    return NextResponse.json({
      ...p,
      variant_options: variants,
      delivery_charge: p.delivery_charge ?? 25,
      availability: p.availability || "in_stock",
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
