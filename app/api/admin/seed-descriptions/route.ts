import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Product name keyword → description
const DESCRIPTIONS: Record<string, string> = {
  "breast boneless": "Tender, skinless boneless chicken breast — perfect for grilling, curries, and stir-fry. Cleaned and hygienically packed fresh daily.",
  "lollipop": "Classic chicken lollipops marinated and cleaned — great for deep frying or air frying. A crowd favourite at any party.",
  "wings": "Juicy chicken wings — ideal for grilling, baking, or frying. Packed fresh and ready to cook.",
  "biryani": "Premium biryani cut with bone-in leg pieces — specially portioned for rich, flavourful biryani.",
  "popcorn": "Bite-sized marinated chicken chunks seasoned to perfection. Ready to fry — crispy on the outside, juicy inside.",
  "chicken 65": "Classic Chicken 65 marinade — spiced with red chilli, ginger, garlic, and aromatic masala. Just fry and serve.",
  "chicken wings": "Marinated chicken wings with a spicy Kerala-style coating. Ready to cook in minutes.",
  "mavula": "Fresh Mavula (Barracuda) fish, cleaned and cut to order. A firm, white-fleshed sea fish with mild flavour.",
  "karala": "Fresh Karavela (Bittergourd fish) cleaned and ready to cook. Known for its distinctive taste and firm texture.",
  "vanjaram": "Premium Vanjaram (King Mackerel / Seer Fish) — one of the most prized sea fish, perfect for fry or curry.",
  "nagara": "Nagara fish (Threadfin Bream) — fresh, firm, and ideal for spicy South Indian fish curry.",
  "manapatu": "Manapatu Salai (Sardines) — rich in omega-3 fatty acids. Best pan-fried with a spicy masala coating.",
  "nandu": "Big Blue Nandu (Blue Swimming Crab) — premium, meaty crabs ideal for crab masala and chettinad style preparations.",
  "eral": "Big Size Eral (Prawns) — large, fresh tiger prawns perfect for prawn curry, fry, or biryani.",
  "aiela": "Fresh Aiela (Indian Oil Sardine) — a coastal favourite, rich in flavour and omega-3. Best enjoyed pan-fried.",
  "para": "Fresh Para fish from local dam waters. Soft texture with a mild, sweet flavour — great for curry.",
  "gelebi": "Fresh Gelebi dam fish — locally sourced, cleaned and ready. A popular choice for light fish curry.",
  "seela": "Dam Seela (Snakehead Murrel) — prized for its delicate flavour and tender flesh. Excellent in spicy curries.",
  "katala": "Fresh Katala dam fish — firm flesh with a rich, earthy taste. Ideal for dry-roast preparations.",
};

function findDescription(productName: string): string {
  const lower = (productName || "").toLowerCase();
  for (const [key, desc] of Object.entries(DESCRIPTIONS)) {
    if (lower.includes(key)) return desc;
  }
  return "Fresh, hygienically packed and sourced locally. Cleaned and ready to cook.";
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get("secret") !== "seed") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const { data: products, error } = await db
    .from("products")
    .select("id, name, description");

  if (error || !products) {
    return NextResponse.json({ error: error?.message || "Failed to fetch products" }, { status: 500 });
  }

  const results: any[] = [];
  for (const p of products) {
    const description = findDescription(p.name);
    const { error: updateError } = await db
      .from("products")
      .update({ description })
      .eq("id", p.id);

    results.push({
      name: p.name,
      description,
      success: !updateError,
      error: updateError?.message,
    });
  }

  return NextResponse.json({ updated: results.length, results });
}
