import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.toLowerCase().trim() || "";
    console.log("API HIT:", q);

    // If empty: return []
    if (!q) {
      return NextResponse.json({ success: true, products: [] });
    }

    // Fetch products with categories
    const { data: products, error } = await supabase
      .from("products")
      .select("*, categories ( id, name )")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Intelligent Sorting Logic
    const results = (products ?? []).map((p: any) => {
      const name = p.name.toLowerCase();
      const category = (p.categories?.name || "").toLowerCase();
      
      let score = 0;
      if (name === q) score = 100; // Exact Match
      else if (name.startsWith(q)) score = 80; // Prefix Match
      else if (name.includes(q)) score = 60; // Partial Match
      else if (category.includes(q)) score = 40; // Category Match
      
      return { ...p, _score: score };
    })
    .filter(p => p._score > 0)
    .sort((a, b) => b._score - a._score)
    .slice(0, 20);

    return NextResponse.json({ success: true, count: results.length, products: results });
  } catch (error: any) {
    console.error("[Search API Error]", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
