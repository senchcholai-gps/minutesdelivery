import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "delivery_settings")
      .single();

    if (error) throw error;

    return NextResponse.json(data.value);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
