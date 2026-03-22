"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { useCartStore } from "@/lib/store"
import { useAuth } from "@/hooks/useAuth"
import { supabase } from "@/lib/supabaseClient"
import toast from "react-hot-toast"
import {
  Loader2, CheckCircle2, AlertCircle, ShoppingBag, MapPin, User, Phone, ChevronRight, Pencil, Banknote
} from "lucide-react"
import { cleanProductName } from "@/lib/utils"

interface Profile {
  full_name?: string
  phone?: string
  address_line1?: string
  address_line2?: string
  city?: string
  district?: string
  state?: string
  pincode?: string
}



export default function CheckoutPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { items, clearCart, fetchCart, getCartSummary } = useCartStore()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [profileLoading, setProfileLoading] = useState(true)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Payment method is fixed to COD — no selection needed
  const paymentMethod = "COD"

  const { subtotal, deliveryCharge, total } = getCartSummary()

  // ── Auth guard ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login?redirect=/checkout")
    }
  }, [user, authLoading, router])

  // ── Fetch profile + cart ─────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return
    fetchCart()
    async function loadProfile() {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setProfileLoading(false); return }
      try {
        const res = await fetch("/api/profile", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setProfile(data ?? {})
        }
      } catch {}
      setProfileLoading(false)
    }
    loadProfile()
  }, [user, fetchCart])

  const hasAddress = !!(profile?.address_line1 && profile?.city && profile?.pincode)

  // ── Create order in our DB ───────────────────────────────────────────────
  const createInternalOrder = async (token: string) => {
    const formattedAddress = [
      profile?.address_line1, profile?.address_line2,
      profile?.city, profile?.district,
      profile?.state, profile?.pincode,
    ].filter(Boolean).join(", ")

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        user_id: user!.id,
        customer_name: profile?.full_name || "Guest",
        phone: profile?.phone || "Not Provided",
        address: formattedAddress || "Not Provided",
        total_amount: total,
        delivery_charge: deliveryCharge,
        payment_method: paymentMethod,
        cart_items: items,
      }),
    })

    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error || "Failed to place order")
    }
    return res.json()
  }

  // ── Handle Place Order (COD only) ────────────────────────────────────────
  const handlePlaceOrder = async () => {
    if (!hasAddress) {
      toast.error("Please add your delivery address in your profile first")
      return
    }

    setIsPlacingOrder(true)
    setError(null)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token!

      const orderData = await createInternalOrder(token)
      setPlacedOrderId(orderData.order_id)
      setOrderSuccess(true)
      clearCart()
      await fetchCart()
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsPlacingOrder(false)
    }
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (authLoading || profileLoading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex h-[60vh] items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
        </div>
        <Footer />
      </main>
    )
  }

  // ── Order Success screen ─────────────────────────────────────────────────
  if (orderSuccess) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
          <div className="mb-6 rounded-full bg-primary/10 p-6">
            <CheckCircle2 className="h-16 w-16 text-primary" />
          </div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">Order Placed! 🎉</h1>
          {placedOrderId && (
            <div className="mt-4 px-6 py-2 bg-white border-2 border-primary/20 rounded-2xl shadow-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Order ID</p>
              <p className="text-lg font-black text-primary select-all">#{placedOrderId}</p>
            </div>
          )}
          <p className="mt-4 max-w-sm text-gray-500 font-medium leading-relaxed">
            Your fresh cuts are being prepared. Expected delivery in <strong className="text-primary">60 minutes</strong>.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <button onClick={() => router.push("/")} className="rounded-2xl bg-primary px-8 py-4 text-white font-black shadow-xl shadow-primary/20 transition hover:scale-[1.02]">
              Return Home
            </button>
            <button onClick={() => router.push("/products")} className="rounded-2xl border-2 border-gray-200 px-8 py-4 font-black text-gray-700 transition hover:scale-[1.02]">
              Shop More
            </button>
          </div>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto max-w-5xl px-4 pt-10 pb-20">
        <h1 className="mb-8 text-4xl font-black text-gray-900 tracking-tight">Checkout</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-6 py-24 bg-white rounded-3xl shadow-sm">
            <ShoppingBag className="h-16 w-16 text-gray-200" />
            <h2 className="text-2xl font-black text-gray-900">Your cart is empty</h2>
            <button onClick={() => router.push("/products")} className="rounded-2xl bg-primary px-8 py-4 text-white font-black shadow-xl shadow-primary/20 transition hover:scale-[1.02]">
              Browse Products
            </button>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
            {/* Left column */}
            <div className="space-y-6">

              {/* Delivery Address */}
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-black text-gray-900">Delivery Address</h2>
                  </div>
                  <Link href="/profile" className="flex items-center gap-1 text-sm font-bold text-primary hover:underline">
                    <Pencil className="h-3.5 w-3.5" />
                    {hasAddress ? "Edit" : "Add Address"}
                  </Link>
                </div>

                {hasAddress ? (
                  <div className="rounded-2xl bg-primary/5 border border-primary/10 p-4 space-y-1">
                    {profile?.full_name && (
                      <p className="font-bold text-gray-900 flex items-center gap-1.5">
                        <User className="h-4 w-4 text-primary" /> {profile.full_name}
                      </p>
                    )}
                    {profile?.phone && (
                      <p className="text-gray-600 text-sm flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5 text-gray-400" /> {profile.phone}
                      </p>
                    )}
                    <p className="text-gray-700 text-sm mt-2">
                      {[profile.address_line1, profile.address_line2, profile.city, profile.district, profile.state, profile.pincode]
                        .filter(Boolean).join(", ")}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-orange-50 border border-orange-100 p-4">
                    <p className="text-orange-700 font-bold text-sm">⚠️ No delivery address saved yet.</p>
                    <p className="text-orange-600 text-sm mt-1">Please add your address in profile before placing an order.</p>
                    <Link href="/profile" className="mt-3 inline-flex items-center gap-1 rounded-xl bg-orange-500 text-white px-4 py-2 text-sm font-bold transition hover:bg-orange-600">
                      Add Address Now <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                )}
              </div>

              {/* Order Items */}
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <h2 className="text-lg font-black text-gray-900 mb-4">Order Items ({items.length})</h2>
                <div className="divide-y divide-gray-50">
                  {items.map((item: any) => (
                    <div key={item.id} className="py-4 space-y-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900">{cleanProductName(item.name)}</p>
                          <p className="text-sm text-gray-500">
                            {item.variant_label} × {item.quantity}{" "}
                            <span className="text-gray-400">@ ₹{item.unit_price} each</span>
                          </p>
                          <p className="text-xs text-gray-400">
                            Delivery: {item.delivery_charge === 0 ? "Free" : `₹${item.delivery_charge}`}
                          </p>
                        </div>
                        <p className="font-black text-primary text-lg">₹{(item.unit_price ?? 0) * item.quantity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Payment Method – COD only */}
              <div className="bg-white rounded-3xl shadow-sm p-6">
                <h2 className="text-lg font-black text-gray-900 mb-4">Payment Method</h2>
                <div className="flex items-center gap-4 p-4 rounded-2xl border-2 border-primary bg-primary/5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                    <Banknote className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-black text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-sm text-gray-500 mt-0.5">Pay with cash when your order is delivered.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column – Order Summary */}
            <div className="lg:sticky lg:top-24 h-fit">
              <div className="bg-white rounded-3xl shadow-xl p-6 space-y-6">
                <h2 className="text-2xl font-black text-gray-900">Order Summary</h2>

                <div className="space-y-3">
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Subtotal</span>
                    <span className="text-gray-900 font-bold">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-gray-600 font-medium">
                    <span>Delivery Fee</span>
                    <span className={deliveryCharge === 0 ? "text-primary font-black" : "text-gray-900 font-bold"}>
                      {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                    </span>
                  </div>
                  {deliveryCharge === 0 ? (
                    <p className="text-xs text-primary font-bold text-right">🎉 Free delivery applied</p>
                  ) : (
                    <div className="space-y-1">
                      <p className="text-xs text-gray-400 font-bold text-right">₹{deliveryCharge} delivery charge applied</p>
                      {subtotal < useCartStore.getState().deliverySettings.free_delivery_threshold && (
                        <p className="text-[10px] text-primary font-bold text-right italic">
                          Add ₹{useCartStore.getState().deliverySettings.free_delivery_threshold - subtotal} more for free delivery
                        </p>
                      )}
                    </div>
                  )}
                  <div className="flex justify-between border-t-2 border-gray-50 pt-4">
                    <span className="text-xl font-bold text-gray-500 uppercase tracking-wide">Total</span>
                    <span className="text-3xl font-black text-primary tracking-tight">₹{total}</span>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <button
                  onClick={handlePlaceOrder}
                  disabled={
                    isPlacingOrder ||
                    !hasAddress ||
                    !useCartStore.getState().deliverySettings.acceptingOrders
                  }
                  className="w-full rounded-2xl bg-primary py-5 text-white text-xl font-black shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
                >
                  {isPlacingOrder ? (
                    <><Loader2 className="h-5 w-5 animate-spin" /> Processing...</>
                  ) : !useCartStore.getState().deliverySettings.acceptingOrders ? (
                    "Orders Currently Paused"
                  ) : !hasAddress ? (
                    "Add Address First"
                  ) : (
                    "Place Order (Cash on Delivery) 🛒"
                  )}
                </button>

                {!useCartStore.getState().deliverySettings.acceptingOrders && (
                  <div className="flex items-center gap-3 rounded-2xl bg-red-50 border border-red-100 p-4 text-red-700 animate-in fade-in duration-500">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <div className="text-xs">
                      <p className="font-black uppercase tracking-tight">System is Offline</p>
                      <p className="font-bold italic mt-0.5">We are currently not accepting new orders. Please check back later.</p>
                    </div>
                  </div>
                )}

                <p className="text-center text-xs text-gray-400">
                  By placing this order you agree to our terms and conditions.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
