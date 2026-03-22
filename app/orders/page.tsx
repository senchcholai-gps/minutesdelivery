"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import {
  Loader2, ShoppingBag, Truck, XCircle, CheckCircle2,
  Clock, Package, MapPin
} from "lucide-react"

// ── Matches the canonical shape returned by GET /api/orders ──────────────────
interface OrderItem {
  id: string
  quantity: number
  unit_price?: number
  variant_label?: string
  product_name?: string
  products: {
    name: string
    price: number
    image_url?: string
  } | null
}

interface Order {
  order_id: string          // API returns order_id (mapped from id)
  created_at: string
  total: number             // API returns total (mapped from total_amount)
  status: string
  delivery_address?: string // may be null in older orders
  payment_method?: string
  payment_status?: string
  order_items: OrderItem[]
}

// ── Status helpers ───────────────────────────────────────────────────────────
const STATUS_STEPS = ["pending", "processing", "picked_up", "on_the_way", "delivered"] as const
type StatusStep = typeof STATUS_STEPS[number]

function getStatusConfig(status: string) {
  switch (status?.toLowerCase()) {
    case "pending":    return { label: "Pending",    emoji: "🟡", color: "bg-yellow-100 text-yellow-700", icon: Clock,         iconColor: "text-yellow-500" }
    case "processing": return { label: "Processing", emoji: "🔵", color: "bg-blue-100 text-blue-700",     icon: Package,       iconColor: "text-blue-500" }
    case "picked_up":  return { label: "Picked Up",  emoji: "🟠", color: "bg-orange-100 text-orange-700", icon: Package,       iconColor: "text-orange-500" }
    case "on_the_way": return { label: "On The Way", emoji: "🚚", color: "bg-teal-100 text-teal-700",     icon: Truck,         iconColor: "text-teal-500" }
    case "delivered":  return { label: "Delivered",  emoji: "🟢", color: "bg-green-100 text-green-700",   icon: CheckCircle2,  iconColor: "text-green-600" }
    case "cancelled":  return { label: "Cancelled",  emoji: "🔴", color: "bg-red-100 text-red-700",       icon: XCircle,       iconColor: "text-red-500" }
    default:           return { label: status,       emoji: "⚪", color: "bg-gray-100 text-gray-700",     icon: Clock,         iconColor: "text-gray-400" }
  }
}

// Linear stepper — not shown for cancelled orders
function StatusStepper({ status }: { status: string }) {
  if (status === "cancelled") return null
  const currentIdx = STATUS_STEPS.indexOf(status as StatusStep)

  return (
    <div className="mt-4 px-1">
      <div className="flex items-center gap-0">
        {STATUS_STEPS.map((step, idx) => {
          const done = idx <= currentIdx
          const current = idx === currentIdx
          const cfg = getStatusConfig(step)
          const Icon = cfg.icon
          return (
            <div key={step} className="flex-1 flex flex-col items-center relative">
              {/* Connector line */}
              {idx > 0 && (
                <div className={`absolute top-4 right-1/2 w-full h-0.5 -z-0 ${idx <= currentIdx ? "bg-primary" : "bg-gray-200"}`} />
              )}
              {/* Circle */}
              <div className={`z-10 h-8 w-8 rounded-full flex items-center justify-center border-2 transition-all ${
                done ? "border-primary bg-primary" : "border-gray-200 bg-white"
              } ${current ? "ring-4 ring-primary/20" : ""}`}>
                <Icon className={`h-4 w-4 ${done ? "text-white" : "text-gray-300"}`} />
              </div>
              {/* Label */}
              <p className={`mt-1.5 text-[10px] font-bold text-center leading-tight hidden sm:block ${
                done ? "text-primary" : "text-gray-400"
              }`}>{cfg.label}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const fetchRef = useRef<() => void>(() => {})

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/orders")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!user) return

    async function fetchOrders(silent = false) {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const token = session?.access_token
        if (!token) throw new Error("No session")

        const res = await fetch("/api/orders", {
          headers: { Authorization: `Bearer ${token}` },
          // Prevent browser caching so we always get fresh status
          cache: "no-store",
        })
        if (res.ok) {
          const data = await res.json()
          setOrders(data)
        }
      } catch (err) {
        console.error("Failed to fetch orders:", err)
      } finally {
        if (!silent) setIsLoading(false)
      }
    }

    fetchRef.current = () => fetchOrders(true)
    fetchOrders(false)

    // Poll every 12 seconds for fresh status
    const interval = setInterval(() => fetchRef.current(), 12_000)
    return () => clearInterval(interval)
  }, [user])

  if (authLoading || (isLoading && user)) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
        </div>
        <Footer />
      </main>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-4xl px-4 pt-10 pb-20">
        <div className="mb-10">
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Order History</h1>
          <p className="mt-2 text-gray-500 font-medium italic">Track and manage your fresh cut deliveries.</p>
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24 bg-white rounded-3xl shadow-sm border border-gray-100">
            <div className="bg-gray-50 p-6 rounded-full">
              <ShoppingBag className="h-16 w-16 text-gray-200" />
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-black text-gray-900">No orders yet</h2>
              <p className="text-gray-500 mt-1 font-medium italic">Hungry? Let&apos;s fix that!</p>
            </div>
            <button
              onClick={() => router.push("/products")}
              className="mt-4 rounded-2xl bg-primary px-8 py-4 text-white font-black shadow-xl shadow-primary/20 transition hover:scale-[1.02] active:scale-95"
            >
              Start Shopping
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => {
              const cfg = getStatusConfig(order.status)
              const StatusIcon = cfg.icon
              return (
                <div key={order.order_id} className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Header */}
                  <div className="p-6 border-b border-gray-50 bg-gray-50/30 flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100">
                        <StatusIcon className={`h-5 w-5 ${cfg.iconColor}`} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Order ID</p>
                        <p className="font-black text-gray-900 italic">#{order.order_id.slice(0, 8).toUpperCase()}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="hidden sm:block">
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">Date</p>
                        <p className="font-bold text-gray-900">{new Date(order.created_at).toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider text-right">Total Paid</p>
                        <p className="font-black text-primary text-xl tracking-tight">₹{order.total}</p>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-6">
                    {/* Status pill */}
                    <div className="flex items-center gap-2 mb-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-widest ${cfg.color}`}>
                        {cfg.emoji} {cfg.label}
                      </span>
                      <span className="text-gray-300">•</span>
                      <p className="text-sm font-medium text-gray-500 italic">
                        {order.order_items.length} {order.order_items.length === 1 ? "item" : "items"}
                      </p>
                    </div>

                    {/* Progress stepper */}
                    <StatusStepper status={order.status} />

                    {/* Items */}
                    <div className="mt-6 space-y-3">
                      {order.order_items.map((item) => {
                        const price = item.unit_price ?? item.products?.price ?? 0
                        return (
                          <div key={item.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-xs font-bold text-gray-400">
                                {item.quantity}×
                              </div>
                              <div>
                                <p className="font-bold text-gray-800">{item.products?.name || item.product_name || "Unknown Product"}</p>
                                {item.variant_label && (
                                  <p className="text-xs text-gray-400">{item.variant_label}</p>
                                )}
                              </div>
                            </div>
                            <p className="font-bold text-gray-900 italic">₹{price * item.quantity}</p>
                          </div>
                        )
                      })}
                    </div>

                    {/* Delivery address */}
                    {order.delivery_address && (
                      <div className="mt-6 pt-6 border-t border-gray-50">
                        <div className="flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-gray-300 mt-1 flex-shrink-0" />
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Delivered To</p>
                            <p className="text-sm text-gray-600 font-medium italic leading-snug">{order.delivery_address}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Payment info */}
                    {order.payment_method && (
                      <div className="mt-4 flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-400 uppercase">Payment:</span>
                        <span className="text-xs font-black text-gray-700 uppercase">{order.payment_method}</span>
                        {order.payment_status && (
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                            order.payment_status === "paid" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
                          }`}>{order.payment_status}</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
