import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function createServiceClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, internalOrderId } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ success: false, error: "Missing payment fields" }, { status: 400 });
    }

    // ── Verify HMAC signature ─────────────────────────────────────────────────
    const secret = process.env.RAZORPAY_KEY_SECRET!;
    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (generated_signature !== razorpay_signature) {
      console.error("[Razorpay verify] Signature mismatch");
      return NextResponse.json({ success: false, error: "Payment verification failed" }, { status: 400 });
    }

    // ── Update order in DB ────────────────────────────────────────────────────
    if (internalOrderId) {
      const db = createServiceClient();
      const { error } = await db
        .from("orders")
        .update({
          payment_status: "paid",
          status: "confirmed",
          transaction_id: razorpay_payment_id,
          razorpay_order_id: razorpay_order_id,
        })
        .eq("id", internalOrderId);

      if (error) {
        console.error("[Razorpay verify] DB update error:", error.message);
        // Payment is verified but DB update failed — log but still return success
        // so user flow doesn't break. Admin can reconcile from Razorpay dashboard.
      }
    }

    return NextResponse.json({ success: true, payment_id: razorpay_payment_id });
  } catch (err: any) {
    console.error("[Razorpay verify]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
