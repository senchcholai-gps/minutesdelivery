import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { id, status, payment_status } = body;

    console.log("👉 Incoming:", body);

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabase
      .from("orders")
      .update({
        status,
        payment_status,
      })
      .eq("id", id)
      .select()
      .maybeSingle();

    if (error) {
      console.error("❌ Supabase Error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    console.log("✅ Updated:", data);

    return NextResponse.json({
      success: true,
      order: data,
    });

  } catch (err: any) {
    console.error("🔥 FULL ERROR:", err);
    return NextResponse.json(
      { error: err.message || "Unknown error" },
      { status: 500 }
    );
  }
}