import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  console.log("Deleting order items...");
  const { error: err1 } = await supabase.from("order_items").delete().not("id", "is", null);
  if (err1) return NextResponse.json({ error: err1 }, { status: 500 });
  
  console.log("Deleting orders...");
  const { error: err2 } = await supabase.from("orders").delete().not("id", "is", null);
  if (err2) return NextResponse.json({ error: err2 }, { status: 500 });

  return NextResponse.json({ message: "DB reset complete." });
}
