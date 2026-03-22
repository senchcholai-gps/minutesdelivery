"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ShoppingBag, ListOrdered, Users, TrendingUp, DollarSign, Package, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabaseClient"

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeUsers: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const [
          { count: productCount },
          { data: orders, count: orderCount },
          { count: userCount }
        ] = await Promise.all([
          supabase.from("products").select("*", { count: "exact", head: true }),
          supabase.from("orders").select("total_price", { count: "exact" }),
          supabase.from("user_profiles").select("*", { count: "exact", head: true })
        ])

        const revenue = orders?.reduce((sum, order) => sum + (order.total_price || 0), 0) || 0

        setStats({
          totalProducts: productCount || 0,
          totalOrders: orderCount || 0,
          totalRevenue: revenue,
          activeUsers: userCount || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    {
      title: "Total Revenue",
      value: `₹${stats.totalRevenue}`,
      icon: DollarSign,
      color: "text-primary",
      bg: "bg-primary/10",
      href: "/admin/revenue",
    },
    {
      title: "Total Orders",
      value: stats.totalOrders.toString(),
      icon: ListOrdered,
      color: "text-blue-600",
      bg: "bg-blue-50",
      href: "/admin/orders",
    },
    {
      title: "Total Products",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "text-purple-600",
      bg: "bg-purple-50",
      href: "/admin/products",
    },
    {
      title: "Active Users",
      value: stats.activeUsers.toString(),
      icon: Users,
      color: "text-orange-600",
      bg: "bg-orange-50",
      href: "/admin/users",
    },
  ]

  return (
    <div className="space-y-8">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Link href={stat.href} key={index} className="block group">
            <Card className="border-none shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 ring-1 ring-transparent hover:ring-primary/20 cursor-pointer h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">{stat.title}</p>
                    <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
                  </div>
                  <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-xs text-primary font-medium">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  <span>+12% from last month</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Clock className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No recent activity</p>
              <p className="text-xs text-gray-500 mt-1">Orders will appear here as they come in.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Top Selling
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-gray-400">
              <Package className="h-10 w-10 mb-3 opacity-20" />
              <p className="text-sm font-medium">No sales data yet</p>
              <p className="text-xs text-gray-500 mt-1">Check back after your first few orders.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
