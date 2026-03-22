import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

export async function GET(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const db = createServiceClient()

    let query = db
      .from("orders")
      .select(`
        id,
        created_at,
        total_amount,
        total_price,
        status,
        payment_method,
        payment_status,
        transaction_id,
        customer_name,
        phone,
        address,
        delivery_address,
        user_id,
        order_items (
          *,
          products (
            name,
            categories ( name )
          )
        )
      `)

    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get("orderId")
    const customer = searchParams.get("customer")?.toLowerCase()
    const status = searchParams.get("status")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")

    if (orderId) query = query.eq("id", orderId)
    if (status && status !== "all") query = query.eq("status", status)
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00Z`)
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59Z`)
    if (customer) query = query.ilike("customer_name", `%${customer}%`)

    const { data: orders, error: ordersError } = await query.order("created_at", { ascending: false })


    if (ordersError) throw ordersError

    // Fetch user profiles separately to avoid FK join issues
    const userIds = [...new Set(orders?.map((o: any) => o.user_id).filter(Boolean))]
    let profileMap: Record<string, any> = {}
    if (userIds.length > 0) {
      const { data: profiles } = await db
        .from("user_profiles")
        .select("id, full_name, phone, email, address_line1, address_line2, city, pincode")
        .in("id", userIds as string[])
      profiles?.forEach((p: any) => { profileMap[p.id] = p })
    }

    const enriched = orders?.map((order: any) => ({
      order_id: order.id,
      customer_name: order.customer_name || profileMap[order.user_id]?.full_name || "Guest",
      total: order.total_amount ?? order.total_price ?? 0,
      delivery_charge: order.delivery_charge ?? 0,
      status: order.status,
      created_at: order.created_at,
      payment_method: order.payment_method,
      payment_status: order.payment_status,
      transaction_id: order.transaction_id,
      address: order.delivery_address || order.address || profileMap[order.user_id]?.address_line1,
      user_profile: profileMap[order.user_id] || null,
      order_items: order.order_items
    }))

    return NextResponse.json(enriched)
  } catch (error: any) {
    console.error("[AdminOrders GET]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
