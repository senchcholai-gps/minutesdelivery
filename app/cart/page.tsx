"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Trash2, ShoppingBag, ArrowRight, Loader2, AlertCircle, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { useCartStore } from "@/lib/store"
import { useRouter } from "next/navigation"
import { cleanProductName } from "@/lib/utils"

export default function CartPage() {
  const router = useRouter()
  const { items, isLoading, fetchCart, removeItem, updateQuantity, updateVariant, getCartSummary, deliverySettings } = useCartStore()
  const [mounted, setMounted] = useState(false)
 
  useEffect(() => { setMounted(true); fetchCart() }, [fetchCart])
 
  const { subtotal, deliveryCharge, total } = getCartSummary()

  if (!mounted) return null

  return (
    <main className="min-h-screen bg-gray-50/50">
      <Navbar />

      <div className="container mx-auto px-4 pt-20 pb-16 max-w-5xl">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between border-b-2 border-gray-100 pb-4">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight uppercase">Your Tray</h1>
            <p className="text-sm text-gray-400 font-bold italic">{items.length} items</p>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 bg-white rounded-3xl shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
              <p className="mt-4 text-sm text-gray-400 font-bold italic">Loading your selection...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white rounded-3xl shadow-sm border-2 border-dashed border-gray-100 text-center p-8">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                <ShoppingBag className="h-10 w-10 text-gray-200" />
              </div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight mb-3">Your tray is empty!</h2>
              <p className="text-gray-500 italic max-w-sm mb-8 text-sm font-medium">
                Add fresh cuts to get started.
              </p>
              <Link href="/">
                <Button className="h-14 px-8 rounded-xl bg-primary text-white font-black text-lg shadow-xl shadow-primary/20 transition-all hover:scale-105 active:scale-95">
                  Browse Fresh Selection <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid gap-10 lg:grid-cols-3">
              {/* Items */}
              <div className="lg:col-span-2 space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="bg-white p-5 rounded-2xl shadow-sm border border-transparent hover:shadow-md transition-all">
                    <div className="flex items-start gap-4">
                      {/* Image */}
                      <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-gray-50 border border-gray-100">
                        <Image
                          src={item.image || "/images/placeholder.jpg"}
                          alt={cleanProductName(item.name)}
                          fill
                          className="object-cover"
                          key={item.image}
                        />
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-start justify-between">
                          <h3 className="text-base font-black text-gray-900 line-clamp-1">{cleanProductName(item.name)}</h3>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="h-8 w-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center flex-shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>

                        {/* Variant chips */}
                        {(() => {
                          const opts = item.variant_options || []
                          return opts.length > 1 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {opts.map((v: any) => (
                                <button
                                  key={v.label}
                                  onClick={() => updateVariant(item.id, v.label)}
                                  className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide transition-all border ${
                                    item.variant_label === v.label
                                      ? "border-primary bg-primary text-white"
                                      : "border-gray-100 text-gray-400 hover:border-gray-300"
                                  }`}
                                >
                                  {v.label} — ₹{v.price}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="inline-block px-2.5 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                              {item.variant_label} — ₹{item.unit_price}
                            </span>
                          )
                        })()}

                        {/* Quantity + Subtotal */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-2 py-1 border border-gray-100">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-white transition"
                            ><Minus className="h-3 w-3" /></button>
                            <span className="text-sm font-black w-5 text-center">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="h-6 w-6 rounded-lg flex items-center justify-center hover:bg-white transition"
                            ><Plus className="h-3 w-3" /></button>
                          </div>
                          <p className="text-base font-black text-gray-900">₹{item.unit_price * item.quantity}</p>
                        </div>

                        <p className="text-[10px] text-gray-400 font-semibold">
                          Delivery: {item.delivery_charge === 0 ? "Free" : `₹${item.delivery_charge}`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Summary */}
              <div className="lg:col-span-1">
                <div className="sticky top-32 bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100 space-y-8">
                  <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase">Order Summary</h3>

                  <div className="space-y-3">
                    {items.map(item => (
                      <div key={item.id} className="flex justify-between text-sm text-gray-500">
                        <span className="line-clamp-1 flex-1 mr-2">{cleanProductName(item.name)} ({item.variant_label}) ×{item.quantity}</span>
                        <span className="font-black text-gray-900 flex-shrink-0">₹{item.unit_price * item.quantity}</span>
                      </div>
                    ))}
                    <div className="border-t border-gray-100 pt-3 flex justify-between text-sm text-gray-500 font-medium italic">
                      <span>Delivery Fee</span>
                      <span className={`font-black ${deliveryCharge === 0 ? "text-primary" : "text-gray-900"}`}>
                        {deliveryCharge === 0 ? "FREE" : `₹${deliveryCharge}`}
                      </span>
                    </div>
                    {deliveryCharge > 0 && subtotal < deliverySettings.free_delivery_threshold && (
                      <p className="text-[10px] text-primary font-bold italic text-right animate-pulse">
                        Add ₹{deliverySettings.free_delivery_threshold - subtotal} more for FREE delivery!
                      </p>
                    )}
                    {deliveryCharge === 0 && (
                      <p className="text-[10px] text-primary font-bold italic text-right">
                        🎉 Free delivery applied
                      </p>
                    )}
                    {deliveryCharge > 0 && (
                      <p className="text-[10px] text-gray-400 font-bold italic text-right">
                        ₹{deliveryCharge} delivery charge applied
                      </p>
                    )}
                  </div>

                  <div className="pt-6 border-t-4 border-gray-50 space-y-6">
                    <div className="flex justify-between items-center">
                      <span className="text-xl font-bold text-gray-400 uppercase tracking-[0.2em]">Total</span>
                      <span className="text-5xl font-black text-primary tracking-tighter">₹{total}</span>
                    </div>
                    <Link href="/checkout" className={!deliverySettings.acceptingOrders ? "pointer-events-none" : ""}>
                      <Button 
                        disabled={!deliverySettings.acceptingOrders}
                        className="w-full h-20 rounded-[2rem] bg-primary text-white font-black text-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.03] active:scale-[0.97] gap-3"
                      >
                        {deliverySettings.acceptingOrders ? (
                          <>Checkout <ArrowRight className="h-7 w-7" /></>
                        ) : (
                          <>Orders Paused</>
                        )}
                      </Button>
                    </Link>
                  </div>

                  {!deliverySettings.acceptingOrders && (
                    <div className="flex items-center gap-4 bg-red-50 p-6 rounded-[2rem] border border-red-100 animate-in fade-in slide-in-from-top-2">
                      <AlertCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-red-600 font-black uppercase tracking-tight">Orders are currently paused</p>
                        <p className="text-xs text-red-500 font-bold italic leading-tight mt-0.5">We are not accepting new orders at the moment. Please check back later!</p>
                      </div>
                    </div>
                  )}

                  {deliverySettings.acceptingOrders && (
                    <div className="flex items-center gap-4 bg-primary/10 p-4 rounded-3xl border border-primary/20">
                      <AlertCircle className="h-6 w-6 text-primary flex-shrink-0" />
                      <p className="text-xs text-primary font-bold italic">Secure checkout. 30-minute delivery.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </main>
  )
}
