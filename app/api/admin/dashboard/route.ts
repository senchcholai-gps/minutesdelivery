import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const [
      { count: productCount },
      { data: orders, count: orderCount },
      { count: userCount },
      { data: recentActivityData }
    ] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("total_amount", { count: "exact" }),
      supabase.from("user_profiles").select("*", { count: "exact", head: true }),
      supabase.from("orders")
        .select("id, total_amount, status, created_at, customer_name")
        .order("created_at", { ascending: false })
        .limit(10)
    ]);

    const totalRevenue = orders?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0;

    const recentActivity = recentActivityData?.map(order => {
      let message = "";
      if (order.status === "completed") message = "Order Completed";
      else if (order.status === "cancelled") message = "Order Cancelled";
      else message = "New Order Placed";

      return {
        id: order.id,
        type: "order",
        message: `${message} by ${order.customer_name || 'Customer'}`,
        amount: order.total_amount,
        created_at: order.created_at
      };
    }) || [];

    return NextResponse.json({
      totalRevenue,
      totalOrders: orderCount || 0,
      totalProducts: productCount || 0,
      activeUsers: userCount || 0,
      recentActivity
    });
  } catch (error) {
    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
