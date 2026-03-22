"use client"

import { useState, useEffect } from "react"
import { Badge } from "@/components/ui/badge"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { ProductGrid } from "@/components/ProductGrid"
import { Loader2, AlertCircle } from "lucide-react"

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories")
        ])
        
        if (!prodRes.ok) throw new Error("Failed to load products")
        if (!catRes.ok) throw new Error("Failed to load categories")
        
        const [prodData, catData] = await Promise.all([
          prodRes.json(),
          catRes.json()
        ])
        
        setProducts(prodData)
        setCategories(catData)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    const intervalId = setInterval(fetchData, 5000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <main className="min-h-screen bg-background">
      <Navbar />

      {/* Header */}
      <section className="bg-primary py-8 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/20 opacity-30 blur-3xl" />
        <div className="container mx-auto px-4 text-center relative z-10">
          <Badge className="mb-3 bg-yellow-400 text-gray-900 hover:bg-yellow-500 border-none font-bold text-[10px] px-2 py-0">Fresh Daily</Badge>
          <h1 className="text-3xl font-extrabold md:text-4xl tracking-tight">Our Products</h1>
          <p className="mx-auto mt-3 max-w-xl text-base text-primary-foreground/90">
            Premium quality chicken, fish, and meat — freshly cut and delivered to your doorstep in minutes.
          </p>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          {error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <p className="text-lg font-semibold text-gray-900">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="px-6 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition-all font-medium"
              >
                Try Again
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              <div className="text-center mb-4">
                <p className="text-gray-500 font-medium">
                  {isLoading ? "Fetching fresh items..." : `Showing all ${products.length} products available for delivery`}
                </p>
              </div>
              
              <ProductGrid 
                products={products} 
                isLoading={isLoading} 
                categories={categories} 
              />
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
