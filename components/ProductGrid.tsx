"use client"

import { useState, useEffect } from "react"
import { ProductCard } from "./ProductCard"
import { ProductSkeleton } from "./Skeleton"
import { ShoppingBag } from "lucide-react"

interface Variant { label: string; price: number }

interface Product {
  id: string
  name: string
  price?: number
  image: string
  category_id: string
  stock?: number
  variant_options: Variant[]
  delivery_charge?: number
  availability?: string
}

interface Category {
  id: string
  name: string
}

interface ProductGridProps {
  products: Product[]
  isLoading: boolean
  categories: Category[]
}

// Display order for category tabs
const CATEGORY_ORDER = ["Chicken", "Dam Fish", "Sea Fish", "Marinated"]

export function ProductGrid({ products, isLoading, categories }: ProductGridProps) {
  const [activeCategoryId, setActiveCategoryId] = useState<string>("all")

  // Sort categories into the preferred display order
  const sortedCategories = [...categories].sort((a, b) => {
    const ai = CATEGORY_ORDER.indexOf(a.name)
    const bi = CATEGORY_ORDER.indexOf(b.name)
    if (ai === -1 && bi === -1) return a.name.localeCompare(b.name)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })

  // Filter products: show all if "all" is selected, otherwise filter by category_id
  const filteredProducts = (activeCategoryId === "all"
    ? products
    : products.filter((p) => p.category_id === activeCategoryId)
  ).map(p => ({ ...p, stock: p.stock ?? 0 })) as (Product & { stock: number })[]

  const activeCategoryName = activeCategoryId === "all" 
    ? "All Products" 
    : (sortedCategories.find((c) => c.id === activeCategoryId)?.name ?? "")

  if (isLoading) {
    return (
      <div className="space-y-10">
        <div className="flex flex-wrap justify-center gap-4 animate-pulse">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-12 w-32 bg-gray-200 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <ProductSkeleton key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      {/* Category Filter Buttons */}
      <div className="flex flex-wrap justify-center gap-3">
        <button
          onClick={() => setActiveCategoryId("all")}
          className={`h-12 px-7 rounded-2xl font-bold text-sm transition-all duration-200 shadow-sm ${
            activeCategoryId === "all"
              ? "bg-primary text-white shadow-primary/30 shadow-lg scale-105"
              : "bg-white text-gray-600 border border-gray-200 hover:border-primary/50 hover:text-primary hover:bg-primary/10"
          }`}
        >
          All Products
        </button>

        {sortedCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`h-12 px-7 rounded-2xl font-bold text-sm transition-all duration-200 shadow-sm ${
              activeCategoryId === cat.id
                ? "bg-primary text-white shadow-primary/30 shadow-lg scale-105"
                : "bg-white text-gray-600 border border-gray-200 hover:border-primary/50 hover:text-primary hover:bg-primary/10"
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Product Grid */}
      <div className="min-h-[400px]">
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
            <ShoppingBag className="h-12 w-12 text-gray-300 mb-4" />
            <p className="text-gray-500 font-medium text-lg text-center">
              No {activeCategoryName.toLowerCase()} items available right now.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
