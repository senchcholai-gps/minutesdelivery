import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

export async function POST(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { orderId, status } = body

    if (!orderId) {
      return NextResponse.json({ error: "orderId is required" }, { status: 400 })
    }

    const allowedStatuses = ['pending', 'paid']
    if (!status || !allowedStatuses.includes(status.toLowerCase())) {
      return NextResponse.json({ error: `Invalid payment status. Must be one of: ${allowedStatuses.join(', ')}` }, { status: 400 })
    }

    const db = createServiceClient()
    
    // Update the database
    const { data: updatedOrder, error } = await db
      .from("orders")
      .update({ payment_status: status.toLowerCase() })
      .eq("id", orderId)
      .select()
      .single()

    if (error) throw error

    const canonical = {
      order_id: updatedOrder.id,
      customer_name: updatedOrder.customer_name,
      total: updatedOrder.total_amount ?? updatedOrder.total_price ?? 0,
      delivery_charge: updatedOrder.delivery_charge ?? 0,
      status: updatedOrder.status,
      payment_status: updatedOrder.payment_status
    }

    return NextResponse.json(canonical)
  } catch (error: any) {
    console.error("[AdminPaymentUpdate POST]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
