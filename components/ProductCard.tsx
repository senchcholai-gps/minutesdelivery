"use client"

import Image from "next/image"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { ShoppingCart, Plus, Minus } from "lucide-react"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { useCartStore } from "@/lib/store"
import toast from "react-hot-toast"
import { showAddedToCartToast } from "@/lib/toast-utils"
import { useAuth } from "@/hooks/useAuth"
import { cleanProductName } from "@/lib/utils"

interface Variant { label: string; price: number }

interface ProductCardProps {
  product: {
    id: string
    name: string
    image: string
    category_id: string
    stock: number
    variant_options: Variant[]
    delivery_charge?: number
    availability?: string
  }
}

export function ProductCard({ product }: ProductCardProps) {
  const router = useRouter()
  const { user } = useAuth()
  const addItem = useCartStore((state) => state.addItem)
  const [imgError, setImgError] = useState(false)

  const variants: Variant[] = Array.isArray(product.variant_options) ? product.variant_options : []
  const [selectedVariant, setSelectedVariant] = useState<Variant>(variants[0] ?? { label: "", price: 0 })
  const [qty, setQty] = useState(1)

  const inStock = product.availability !== "out_of_stock" && product.stock > 0

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!user) { toast.error("Please login to add items"); router.push("/login"); return }
    if (!selectedVariant.label) { toast.error("Please select a variant"); return }
    if (!inStock) return
    try {
      await addItem(product, selectedVariant.label, qty)
      showAddedToCartToast({ productName: cleanProductName(product.name), quantity: qty, onViewCart: () => router.push('/cart') })
      setQty(1)
    } catch {
      toast.error("Something went wrong. Please try again.")
    }
  }

  return (
    <Card
      className="group overflow-hidden rounded-2xl border-none bg-white shadow-soft transition-all duration-300 hover:scale-[1.02] cursor-pointer"
      onClick={() => router.push(`/product/${product.id}`)}
    >
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Image
          src={imgError ? "/images/placeholder.jpg" : (product.image || "/images/placeholder.jpg")}
          alt={cleanProductName(product.name)}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-110"
          onError={() => setImgError(true)}
        />
        {!inStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white text-xs font-black uppercase tracking-widest bg-red-500 px-3 py-1 rounded-full">Out of Stock</span>
          </div>
        )}
      </div>

      <CardHeader className="p-4 pb-1">
        <h3 className="text-base font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors">{cleanProductName(product.name)}</h3>
      </CardHeader>

      <CardContent className="px-4 pb-2 space-y-2" onClick={e => e.stopPropagation()}>
        {/* Variant chips with price */}
        {variants.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {variants.map(v => (
              <button
                key={v.label}
                type="button"
                onClick={e => { e.stopPropagation(); setSelectedVariant(v) }}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-black tracking-wide transition-all border ${
                  selectedVariant.label === v.label
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-gray-100 text-gray-400 hover:border-gray-200"
                }`}
              >
                {v.label} — ₹{v.price}
              </button>
            ))}
          </div>
        )}

        {/* Quantity selector */}
        <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setQty(q => Math.max(1, q - 1)) }}
            className="h-7 w-7 rounded-lg bg-gray-100 text-gray-700 font-black flex items-center justify-center hover:bg-gray-200 transition"
          ><Minus className="h-3 w-3" /></button>
          <span className="text-sm font-black text-gray-900 w-5 text-center">{qty}</span>
          <button
            type="button"
            onClick={e => { e.stopPropagation(); setQty(q => q + 1) }}
            className="h-7 w-7 rounded-lg bg-gray-100 text-gray-700 font-black flex items-center justify-center hover:bg-gray-200 transition"
          ><Plus className="h-3 w-3" /></button>
          <span className="text-xs text-gray-400 font-semibold ml-auto">₹{selectedVariant.price * qty}</span>
        </div>
      </CardContent>

      <CardFooter className="p-4 pt-2">
        <button
          onClick={handleAddToCart}
          disabled={!inStock}
          className={`w-full h-10 rounded-xl font-black flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] border-none ${
            inStock
              ? "bg-[#FFD700] hover:bg-[#FFD700]/90 text-black shadow-md shadow-yellow-400/10"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
        >
          <ShoppingCart className="h-4 w-4" />
          {inStock ? "Add to Cart" : "Out of Stock"}
        </button>
      </CardFooter>
    </Card>
  )
}
