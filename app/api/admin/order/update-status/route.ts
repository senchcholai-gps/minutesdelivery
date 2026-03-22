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

    const allowedStatuses = ['pending', 'processing', 'picked_up', 'on_the_way', 'delivered', 'cancelled']
    if (!status || !allowedStatuses.includes(status.toLowerCase())) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` }, { status: 400 })
    }

    const db = createServiceClient()
    
    // Verify order exists
    const { data: existing, error: checkError } = await db
      .from("orders")
      .select("id")
      .eq("id", orderId)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Update the database
    const { data: updatedOrder, error } = await db
      .from("orders")
      .update({ status: status.toLowerCase(), updated_at: new Date().toISOString() })
      .eq("id", orderId)
      .select(`
        *,
        order_items (
          *,
          products (
            name,
            price,
            categories ( name )
          )
        )
      `)
      .single()

    if (error) throw error

    // Fetch user profile separately
    let profileMap: Record<string, any> = {}
    if (updatedOrder.user_id) {
       const { data: profiles } = await db
        .from("user_profiles")
        .select("id, full_name, phone, email, address_line1, address_line2, city, pincode")
        .eq("id", updatedOrder.user_id)
        .single()
       if(profiles) profileMap[profiles.id] = profiles
    }

    const enriched = {
      order_id: updatedOrder.id,
      customer_name: updatedOrder.customer_name || profileMap[updatedOrder.user_id]?.full_name || "Guest",
      total: updatedOrder.total_amount ?? updatedOrder.total_price ?? 0,
      delivery_charge: updatedOrder.delivery_charge ?? 0,
      status: updatedOrder.status,
      created_at: updatedOrder.created_at,
      payment_method: updatedOrder.payment_method,
      payment_status: updatedOrder.payment_status,
      transaction_id: updatedOrder.transaction_id,
      address: updatedOrder.delivery_address || updatedOrder.address || profileMap[updatedOrder.user_id]?.address_line1,
      user_profile: profileMap[updatedOrder.user_id] || null,
      order_items: updatedOrder.order_items
    }

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("[AdminOrderUpdate POST]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
