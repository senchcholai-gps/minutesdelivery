import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

export async function GET(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const db = createServiceClient()
    // First: fetch all non-cancelled orders
    const { data: orders, error: ordersError } = await db
      .from("orders")
      .select(`
        id,
        created_at,
        total_price,
        status,
        user_id,
        order_items (
          quantity,
          product_id,
          products (
            name,
            price,
            categories (
              name
            )
          )
        )
      `)
      .neq("status", "cancelled")
      .order("created_at", { ascending: true })

    if (ordersError) throw ordersError

    // Second: fetch user profiles separately for robustness
    const { data: profiles } = await db
      .from("user_profiles")
      .select("id, full_name, email")

    const profileMap = new Map<string, { full_name: string; email: string }>()
    profiles?.forEach((p) => profileMap.set(p.id, { full_name: p.full_name, email: p.email }))

    let totalRevenue = 0
    const byDateMap = new Map<string, number>()
    const byCategoryMap = new Map<string, number>()
    const byUserMap = new Map<string, { name: string; email: string; revenue: number; orders: number }>()

    // Initialize default categories so they always appear in the breakdown
    ;["Chicken", "Seafood", "Marinated"].forEach(cat => {
      if (!byCategoryMap.has(cat)) byCategoryMap.set(cat, 0)
    })

    orders?.forEach((order) => {
      try {
        const price = Number(order.total_price) || 0
        totalRevenue += price

        // By Date
        const dateString = order.created_at
          ? new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
          : "Unknown Date"
        byDateMap.set(dateString, (byDateMap.get(dateString) || 0) + price)

        // By User
        const userId = order.user_id || "guest"
        const profile = profileMap.get(userId)
        const prev = byUserMap.get(userId)
        byUserMap.set(userId, {
          name: profile?.full_name || "Guest User",
          email: profile?.email || "N/A",
          revenue: (prev?.revenue || 0) + price,
          orders: (prev?.orders || 0) + 1,
        })

        // By Category — from actual order_items
        order.order_items?.forEach((item: any) => {
          const catName = item.products?.categories?.name || "Uncategorized"
          const itemPrice = Number(item.products?.price) || 0
          const itemQty = Number(item.quantity) || 1
          byCategoryMap.set(catName, (byCategoryMap.get(catName) || 0) + itemPrice * itemQty)
        })
      } catch (err: any) {
        console.error(`[RevenueAPI] Failed to process order ${order.id}:`, err.message)
      }
    })

    const sortedByCategory = Array.from(byCategoryMap, ([category, revenue]) => ({ category, revenue }))
      .sort((a, b) => b.revenue - a.revenue)

    const sortedByUser = Array.from(byUserMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 50)

    const byDate = Array.from(byDateMap, ([date, revenue]) => ({ date, revenue }))
      .slice(-30)

    // Projected Revenue: simple 12-month projection based on average daily revenue
    const daysSinceFirstOrder = orders && orders.length > 0
      ? Math.max(1, Math.round((Date.now() - new Date(orders[0].created_at).getTime()) / 86400000))
      : 1
    const avgDailyRevenue = totalRevenue / daysSinceFirstOrder
    const projectedMonthly = avgDailyRevenue * 30
    const projectedYearly = avgDailyRevenue * 365

    // Projected by category: assume same growth rate
    const projectedByCategory = sortedByCategory.map(cat => ({
      category: cat.category,
      actual: cat.revenue,
      projected: Math.round((cat.revenue / Math.max(totalRevenue, 1)) * projectedYearly),
    }))

    return NextResponse.json({
      totalRevenue,
      orderCount: orders?.length || 0,
      byDate,
      byCategory: sortedByCategory,
      byUser: sortedByUser,
      projectedMonthly: Math.round(projectedMonthly),
      projectedYearly: Math.round(projectedYearly),
      projectedByCategory,
    })
  } catch (error: any) {
    console.error("[RevenueAPI] Critical error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
