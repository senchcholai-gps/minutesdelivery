"use client"

import { useEffect, useState } from "react"
import { DollarSign, Loader2, TrendingUp, Calendar, Users, Package, RefreshCw, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabaseClient"

interface RevenueData {
  totalRevenue: number
  orderCount: number
  byDate: { date: string; revenue: number }[]
  byCategory: { category: string; revenue: number }[]
  byUser: { name: string; email: string; revenue: number; orders: number }[]
  projectedMonthly: number
  projectedYearly: number
  projectedByCategory: { category: string; actual: number; projected: number }[]
}

const EMPTY_DATA: RevenueData = {
  totalRevenue: 0,
  orderCount: 0,
  byDate: [],
  byCategory: [
    { category: "Chicken", revenue: 0 },
    { category: "Seafood", revenue: 0 },
    { category: "Marinated", revenue: 0 },
  ],
  byUser: [],
  projectedMonthly: 0,
  projectedYearly: 0,
  projectedByCategory: [
    { category: "Chicken", actual: 0, projected: 0 },
    { category: "Seafood", actual: 0, projected: 0 },
    { category: "Marinated", actual: 0, projected: 0 },
  ],
}

const CAT_COLORS: Record<string, string> = {
  Chicken: "bg-yellow-400",
  Seafood: "bg-blue-400",
  Marinated: "bg-red-400",
  Uncategorized: "bg-gray-400",
}

function BarChart({ items, maxValue }: { items: { label: string; value: number; color: string }[]; maxValue: number }) {
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i}>
          <div className="flex justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">{item.label}</span>
            <span className="text-sm font-bold text-gray-900">₹{item.value.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-2 rounded-full ${item.color} transition-all duration-700`}
              style={{ width: maxValue > 0 ? `${Math.min(100, (item.value / maxValue) * 100)}%` : "0%" }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

export default function AdminRevenuePage() {
  const [data, setData] = useState<RevenueData>(EMPTY_DATA)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const fetchRevenue = async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true)
    else setIsLoading(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError("Not authenticated. Please log in as admin.")
        return
      }

      const res = await fetch("/api/admin/revenue", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      })

      if (res.status === 401) {
        setError("Unauthorized. Your account may not have admin privileges.")
        return
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Server error (${res.status})`)
      }

      const json = await res.json()
      // Ensure default categories always appear even if empty
      const defaultCategories = ["Chicken", "Seafood", "Marinated"]
      const existingCats = new Set(json.byCategory.map((c: any) => c.category))
      defaultCategories.forEach(cat => {
        if (!existingCats.has(cat)) json.byCategory.push({ category: cat, revenue: 0 })
      })
      setData(json)
    } catch (err: any) {
      console.error("[RevenuePage] Error:", err.message)
      setError(err.message || "Failed to load revenue data.")
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRevenue()
  }, [])

  if (isLoading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        <p className="mt-4 text-sm text-gray-400 italic">Calculating revenue analytics...</p>
      </div>
    )
  }

  const maxCategoryRevenue = Math.max(...data.byCategory.map((c) => c.revenue), 1)
  const maxProjectedRevenue = Math.max(...data.projectedByCategory.map((c) => c.projected), 1)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Revenue Analytics</h2>
          <p className="text-sm text-gray-500">Gross income breakdown by category, user, and projected growth.</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 w-fit"
          onClick={() => fetchRevenue(true)}
          disabled={isRefreshing}
        >
          <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm bg-gradient-to-br from-primary/90 to-primary text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-primary-foreground/90 uppercase tracking-widest mb-1">Total Revenue</p>
                <h3 className="text-3xl font-black tracking-tight">₹{data.totalRevenue.toLocaleString()}</h3>
                <p className="text-xs text-primary-foreground/80 mt-1">{data.orderCount} orders</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/20">
                <DollarSign className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-blue-100 uppercase tracking-widest mb-1">Projected Monthly</p>
                <h3 className="text-3xl font-black tracking-tight">₹{data.projectedMonthly.toLocaleString()}</h3>
                <p className="text-xs text-blue-100 mt-1">Based on avg daily sales</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/20">
                <Calendar className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-purple-100 uppercase tracking-widest mb-1">Projected Yearly</p>
                <h3 className="text-3xl font-black tracking-tight">₹{data.projectedYearly.toLocaleString()}</h3>
                <p className="text-xs text-purple-100 mt-1">12-month estimate</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/20">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-100 uppercase tracking-widest mb-1">Unique Customers</p>
                <h3 className="text-3xl font-black tracking-tight">{data.byUser.length}</h3>
                <p className="text-xs text-orange-100 mt-1">Who have placed orders</p>
              </div>
              <div className="p-3 rounded-2xl bg-white/20">
                <Users className="h-7 w-7 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Category */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
              <Package className="h-5 w-5 text-purple-500" />
              Actual Revenue by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byCategory.every(c => c.revenue === 0) ? (
              <div className="py-8 text-center">
                <Package className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                <p className="text-sm italic text-gray-400">No revenue recorded yet. Place orders to see data.</p>
              </div>
            ) : (
              <BarChart
                maxValue={maxCategoryRevenue}
                items={data.byCategory.map(cat => ({
                  label: cat.category,
                  value: cat.revenue,
                  color: CAT_COLORS[cat.category] || "bg-gray-400",
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Projected Revenue by Category */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
              <TrendingUp className="h-5 w-5 text-primary" />
              Projected Yearly by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.projectedByCategory.every(c => c.projected === 0) ? (
              <div className="py-8 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                <p className="text-sm italic text-gray-400">Projections will appear once orders are placed.</p>
              </div>
            ) : (
              <BarChart
                maxValue={maxProjectedRevenue}
                items={data.projectedByCategory.map(cat => ({
                  label: cat.category,
                  value: cat.projected,
                  color: "bg-primary",
                }))}
              />
            )}
          </CardContent>
        </Card>

        {/* Revenue by Date */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
              <Calendar className="h-5 w-5 text-blue-500" />
              Revenue by Date
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byDate.length === 0 ? (
              <div className="py-8 text-center">
                <Calendar className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                <p className="text-sm italic text-gray-400">No order dates to display.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                {[...data.byDate].reverse().map((entry, i) => (
                  <div key={i} className="flex items-center justify-between py-1 border-b border-gray-50 last:border-0">
                    <span className="text-sm font-medium text-gray-700">{entry.date}</span>
                    <Badge variant="outline" className="font-bold text-gray-900 border-gray-200">
                      ₹{entry.revenue.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
              <Users className="h-5 w-5 text-orange-500" />
              Top Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.byUser.length === 0 ? (
              <div className="py-8 text-center">
                <Users className="h-8 w-8 mx-auto text-gray-200 mb-2" />
                <p className="text-sm italic text-gray-400">No customer data yet.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-64 overflow-y-auto pr-2">
                {data.byUser.slice(0, 10).map((user, i) => (
                  <div key={i} className="flex items-center justify-between group">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm">
                        {i + 1}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-gray-900 leading-tight truncate">{user.name}</span>
                        <span className="text-[10px] text-gray-400 truncate">{user.email}</span>
                        <span className="text-[10px] text-gray-400">{user.orders} order{user.orders !== 1 ? "s" : ""}</span>
                      </div>
                    </div>
                    <Badge className="font-bold text-primary bg-primary/5 border-primary/20 flex-shrink-0">
                      ₹{user.revenue.toLocaleString()}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Projection Summary Table */}
      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center gap-2 text-gray-800">
            <TrendingUp className="h-5 w-5 text-primary" />
            Revenue Investment Proposal
          </CardTitle>
          <p className="text-xs text-gray-400 mt-0.5">Projected yearly growth based on current order momentum.</p>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-gray-50 rounded-xl">
                <th className="px-4 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider">Category</th>
                <th className="px-4 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Actual Revenue</th>
                <th className="px-4 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Projected Yearly</th>
                <th className="px-4 py-3 font-bold text-gray-500 uppercase text-xs tracking-wider text-right">Growth %</th>
              </tr>
            </thead>
            <tbody>
              {data.projectedByCategory.map((row, i) => {
                const growth = row.actual > 0 ? Math.round(((row.projected - row.actual) / row.actual) * 100) : null
                return (
                  <tr key={i} className="border-t border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-gray-900">
                      <div className="flex items-center gap-2">
                        <div className={`h-3 w-3 rounded-full ${CAT_COLORS[row.category] || "bg-gray-300"}`} />
                        {row.category}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-700">
                      ₹{row.actual.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-primary">
                      ₹{row.projected.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {growth !== null ? (
                        <Badge className="bg-primary/10 text-primary border-none font-bold">
                          +{growth}%
                        </Badge>
                      ) : (
                        <span className="text-xs text-gray-400 italic">No data</span>
                      )}
                    </td>
                  </tr>
                )
              })}
              <tr className="border-t-2 border-gray-200 bg-gray-50/80">
                <td className="px-4 py-3 font-black text-gray-900">Total</td>
                <td className="px-4 py-3 text-right font-black text-gray-900">₹{data.totalRevenue.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-black text-primary">₹{data.projectedYearly.toLocaleString()}</td>
                <td className="px-4 py-3 text-right">
                  {data.totalRevenue > 0 ? (
                    <Badge className="bg-primary/10 text-primary border-none font-bold">
                      +{Math.round(((data.projectedYearly - data.totalRevenue) / data.totalRevenue) * 100)}%
                    </Badge>
                  ) : (
                    <span className="text-xs text-gray-400 italic">Pending</span>
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
