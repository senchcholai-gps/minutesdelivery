"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { ChevronLeft, ShoppingCart, Loader2, AlertCircle, ShieldCheck, Truck, Clock, Plus, Minus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { useCartStore } from "@/lib/store"
import toast from "react-hot-toast"
import { showAddedToCartToast } from "@/lib/toast-utils"
import { useAuth } from "@/hooks/useAuth"
import { cleanProductName } from "@/lib/utils"

interface Variant { label: string; price: number }

export default function ProductDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const addItem = useCartStore((state) => state.addItem)

  const [product, setProduct] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [imgError, setImgError] = useState(false)
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null)
  const [quantity, setQuantity] = useState(1)
  const [adding, setAdding] = useState(false)

  useEffect(() => {
    let cancel = false
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`)
        if (!res.ok) throw new Error("Product not found")
        const data = await res.json()
        if (!cancel) {
          setProduct(data)
          const variants: Variant[] = Array.isArray(data.variant_options) ? data.variant_options : []
          setSelectedVariant(prev => prev || (variants[0] ?? null))
        }
      } catch (err: any) {
        if (!cancel) setError(err.message)
      } finally {
        if (!cancel) setIsLoading(false)
      }
    }
    fetchProduct()
    const interval = setInterval(fetchProduct, 8000)
    return () => { cancel = true; clearInterval(interval) }
  }, [params.id])

  const handleAddToCart = async () => {
    if (!user) { toast.error("Please login"); router.push("/login"); return }
    if (!selectedVariant?.label) { toast.error("Please select a variant"); return }
    setAdding(true)
    try {
      await addItem(product, selectedVariant.label, quantity)
      showAddedToCartToast({ productName: cleanProductName(product.name), quantity, onViewCart: () => router.push('/cart') })
    } catch {
      toast.error("Failed to add item. Please try again.")
    } finally {
      setAdding(false)
    }
  }

  if (isLoading) return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
      </div>
      <Footer />
    </div>
  )

  if (error || !product) return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar />
      <div className="flex flex-1 flex-col items-center justify-center p-4 text-center space-y-4">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-bold text-gray-900">Product Not Found</h2>
        <Button onClick={() => router.push("/")} variant="outline" className="rounded-xl">Back to Shopping</Button>
      </div>
      <Footer />
    </div>
  )

  const variants: Variant[] = Array.isArray(product.variant_options) ? product.variant_options : []
  const deliveryCharge: number = product.delivery_charge ?? 25
  const inStock = product.availability !== "out_of_stock" && product.stock > 0
  const lineTotal = (selectedVariant?.price ?? 0) * quantity

  return (
    <main className="min-h-screen bg-white">
      <Navbar />

      <div className="container mx-auto px-4 pt-6 pb-12 max-w-6xl">
        <button
          onClick={() => router.back()}
          className="mb-4 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors group"
        >
          <ChevronLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back
        </button>

        <div className="grid gap-8 lg:grid-cols-2 items-start">
          {/* Image */}
          <div className="relative aspect-[4/3] lg:aspect-square overflow-hidden rounded-3xl bg-gray-50 border border-gray-100 shadow-xl">
            <Image
              src={imgError ? "/images/placeholder.jpg" : (product.image || "/images/placeholder.jpg")}
              alt={cleanProductName(product.name)}
              fill
              className="object-cover"
              priority
              key={product.image}
              onError={() => setImgError(true)}
            />
            {!inStock && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-3xl">
                <span className="bg-red-500 text-white text-lg font-black px-6 py-2 rounded-full uppercase tracking-widest">Out of Stock</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex flex-col space-y-4 lg:py-1">
            <div className="space-y-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${inStock ? "text-primary" : "text-red-500"}`}>
                {inStock ? "In Stock" : "Out of Stock"}
              </span>
              <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-tight">
                {cleanProductName(product.name)}
              </h1>
            </div>

            {product.description && (
              <p className="text-base text-gray-500 leading-relaxed font-medium">{product.description}</p>
            )}

            {/* Variant Selector */}
            {variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-black uppercase text-gray-400 tracking-widest">Select Weight & Price</p>
                <div className="flex flex-wrap gap-2">
                  {variants.map(v => (
                    <button
                      key={v.label}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`px-5 py-3 rounded-xl border-2 transition-all ${
                        selectedVariant?.label === v.label
                          ? "border-primary bg-primary/5 text-primary"
                          : "border-gray-100 text-gray-500 hover:border-gray-200"
                      }`}
                    >
                      <span className="block text-sm font-black">{v.label}</span>
                      <span className="block text-lg font-black">₹{v.price}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity + Total */}
            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  className="h-9 w-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition"
                ><Minus className="h-4 w-4" /></button>
                <span className="text-xl font-black w-6 text-center text-gray-900">{quantity}</span>
                <button
                  onClick={() => setQuantity(q => q + 1)}
                  className="h-9 w-9 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center hover:bg-gray-100 transition"
                ><Plus className="h-4 w-4" /></button>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Total</p>
                <p className="text-2xl font-black text-gray-900 tracking-tight leading-none">₹{lineTotal}</p>
              </div>
            </div>

            {/* Add to Cart */}
            <div className="space-y-2">
              <Button
                onClick={handleAddToCart}
                disabled={!inStock || adding || !selectedVariant}
                className="w-full h-14 rounded-2xl bg-[#FFD700] hover:bg-[#FFD700]/90 text-black text-xl font-black shadow-lg shadow-yellow-400/10 transition-all active:scale-[0.98] gap-3 border-none disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adding ? <><Loader2 className="h-5 w-5 animate-spin" /> Adding...</> : <><ShoppingCart className="h-5 w-5" /> Add to Cart</>}
              </Button>
              <p className="text-center text-xs text-gray-400 font-semibold">
                Delivery charge: {deliveryCharge === 0 ? "Free" : `₹${deliveryCharge}`}
              </p>
            </div>

            {/* Trust badges */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2 opacity-50">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Fresh</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <Truck className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-tighter">Fast Delivery</span>
              </div>
              <div className="flex items-center gap-2 opacity-50">
                <Clock className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase tracking-tighter">30 Min</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
