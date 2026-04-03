"use client"

import { useEffect, useState } from "react"
import { AlertCircle, ShieldCheck, Zap, Tag, Package, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { useRouter } from "next/navigation"
import Link from "next/link"

const features = [
  {
    icon: ShieldCheck,
    title: "Fresh Quality",
    description: "We deliver fresh and hygienic meat sourced directly from certified farms.",
  },
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Get your order delivered right to your doorstep within minutes.",
  },
  {
    icon: Tag,
    title: "Best Prices",
    description: "Enjoy affordable and competitive pricing with no hidden charges.",
  },
  {
    icon: Package,
    title: "Clean Packaging",
    description: "All orders are packed safely and hygienically for freshness.",
  },
]

export default function HomePage() {
  const router = useRouter()

  // ── CENTER SEARCH STATE (local, redirect-only) ──
  const [searchQuery, setSearchQuery] = useState("")

  // ── PAGE PRODUCT STATE (unrelated to search) ──
  const [popularProducts, setPopularProducts] = useState<any[]>([])
  const [marinatedProducts, setMarinatedProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // ── REDIRECT SEARCH HANDLER ──
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault() // 🔥 CRITICAL: stop page reload
    const query = searchQuery.trim()
    console.log("Redirecting to search page:", query)
    if (!query) return
    router.push(`/search?q=${encodeURIComponent(query)}`)
  }

  useEffect(() => {
    async function fetchData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch("/api/products"),
          fetch("/api/categories")
        ])
        
        if (!prodRes.ok || !catRes.ok) throw new Error("Failed to fetch data")
        
        const prodData = await prodRes.json()
        const catData = await catRes.json()
        
        const marCat = catData.find((c: any) => c.name === "Marinated")
        
        // Group products by category and take top 2 for preview
        const popular: any[] = []
        catData.forEach((cat: any) => {
          const catProds = prodData.filter((p: any) => p.category_id === cat.id)
          popular.push(...catProds.slice(0, 2))
        })
        
        setPopularProducts(popular)
        
        if (marCat) {
          const marinated = prodData.filter((p: any) => p.category_id === marCat.id)
          setMarinatedProducts(marinated)
        }
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
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-white to-yellow-50 pt-20 pb-24">
        <div className="pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 opacity-50 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 rounded-full bg-yellow-100 opacity-40 blur-3xl" />

        <div className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          <div className="flex flex-col items-center text-center max-w-3xl mx-auto gap-6">
            <span className="inline-block rounded-full bg-primary/10 text-primary text-xs font-bold px-4 py-1.5 tracking-wider uppercase">
              🚀 Delivered in Minutes
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 leading-tight">
              Fresh Meat{" "}
              <span className="text-primary">Delivered</span>{" "}
              in Minutes
            </h1>
            <p className="text-lg md:text-xl text-gray-500 max-w-xl leading-relaxed">
              Order farm-fresh chicken, fish, and meat with lightning-fast delivery straight to your doorstep.
            </p>

            {/* ── HERO SEARCH FORM (redirect only) ── */}
            <form
              onSubmit={handleSearch}
              className="relative flex items-center w-full max-w-md mx-auto bg-white border-2 border-gray-200 rounded-2xl h-12 shadow-sm focus-within:border-primary transition-all overflow-hidden"
            >
              <input
                id="searchInput"
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
                className="flex-1 min-w-0 h-full bg-transparent outline-none text-sm px-4 text-gray-800 placeholder:text-gray-400"
              />
              <button
                type="submit"
                className="h-full px-6 bg-primary text-white font-bold text-sm transition-all active:scale-95 shrink-0"
              >
                Search
              </button>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                onClick={() => document.getElementById("products")?.scrollIntoView({ behavior: "smooth" })}
                className="h-13 px-8 w-full sm:w-auto rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-base shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 gap-2"
              >
                Order Now <ArrowRight className="h-4 w-4" />
              </Button>
              <Link href="/products">
                <Button
                  variant="outline"
                  className="h-13 px-8 w-full sm:w-auto rounded-xl border-2 border-gray-200 text-gray-700 hover:border-primary/50 hover:text-primary font-bold text-base transition-all hover:scale-105 active:scale-95"
                >
                  Browse Products
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── WHY CHOOSE US ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Why Choose <span className="text-primary">Us</span>
            </h2>
            <p className="mt-3 text-gray-500 text-base max-w-lg mx-auto">
              We bring the best quality meat straight from farms to your table — fast, fresh, and affordable.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="w-full p-3 sm:p-4 rounded-xl text-center group flex flex-col items-center bg-gray-50 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/30 hover:-translate-y-1 transition-all duration-300"
              >
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-xl bg-primary flex items-center justify-center mb-3 sm:mb-5 shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
                </div>
                <h3 className="text-sm sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2">{title}</h3>
                <p className="text-gray-500 text-[10px] sm:text-sm leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── POPULAR PRODUCTS (Diverse Selection) ── */}
      <section id="products" className="py-20 bg-gray-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
              Popular <span className="text-primary">Products</span>
            </h2>
            <p className="mt-3 text-gray-500 text-base max-w-lg mx-auto">
              A handpicked selection of our top-selling fresh meats and seafood.
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="aspect-square bg-white rounded-2xl animate-pulse shadow-sm" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center p-20 text-center gap-4">
              <AlertCircle className="h-12 w-12 text-red-400" />
              <h3 className="text-xl font-bold text-gray-900">Unable to load products.</h3>
              <p className="text-gray-500">Please refresh the page and try again.</p>
            </div>
          ) : (
            <div className="space-y-16">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {popularProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
              <div className="flex justify-center">
                <Link href="/products">
                  <Button className="h-14 px-12 w-full sm:w-auto rounded-xl bg-white text-primary border-2 border-primary hover:bg-primary hover:text-white font-bold text-lg shadow-lg hover:shadow-primary/20 transition-all active:scale-95">
                    View All Products
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* ── MARINATED PRODUCTS (Dedicated Section) ── */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <span className="text-primary font-black uppercase tracking-widest text-xs">Chef's Special</span>
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight mt-2">
              Marinated <span className="text-primary">Delights</span>
            </h2>
            <p className="mt-4 text-gray-500 text-lg max-w-lg mx-auto">
              Ready-to-cook marinated meats with authentic flavors. Just fry or grill and enjoy!
            </p>
          </div>

          {!isLoading && !error && marinatedProducts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {marinatedProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </main>
  )
}
