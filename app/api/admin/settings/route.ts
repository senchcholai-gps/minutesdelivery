import { NextResponse } from "next/server";
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck";

export async function PATCH(request: Request) {
  try {
    const { admin } = await verifyAdmin(request);
    if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { free_delivery_threshold, flat_rate, acceptingOrders } = body;

    const db = createServiceClient();
    const { data, error } = await db
      .from("settings")
      .update({ value: { 
        free_delivery_threshold, 
        flat_rate, 
        enabled: true,
        acceptingOrders: acceptingOrders ?? true 
      } })
      .eq("key", "delivery_settings")
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
