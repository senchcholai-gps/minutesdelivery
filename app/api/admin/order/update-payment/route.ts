import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

export async function POST(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  console.log("[update-payment] BODY:", body)

  const { orderId, status } = body

  if (!orderId || !status) {
    return NextResponse.json({ error: "Missing orderId or status" }, { status: 400 })
  }

  const allowedStatuses = ["pending", "paid"]
  if (!allowedStatuses.includes(status.toLowerCase())) {
    return NextResponse.json(
      { error: `Invalid payment status. Must be one of: ${allowedStatuses.join(", ")}` },
      { status: 400 }
    )
  }

  try {
    const db = createServiceClient()

    const { data, error } = await db
      .from("orders")
      .update({ payment_status: status.toLowerCase() })
      .eq("id", orderId)
      .select("id, status, payment_status")
      .maybeSingle()

    if (error) {
      console.error("[update-payment] UPDATE ERROR:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data) {
      console.warn("[update-payment] No order found with id:", orderId)
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    console.log("[update-payment] UPDATE SUCCESS:", data)
    return NextResponse.json({ success: true, order: data }, { status: 200 })
  } catch (err: any) {
    console.error("[update-payment] CRITICAL ERROR:", err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
