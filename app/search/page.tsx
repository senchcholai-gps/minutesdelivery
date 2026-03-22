"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/Navbar"
import { Footer } from "@/components/Footer"
import { ProductCard } from "@/components/ProductCard"
import { SearchInput } from "@/components/SearchInput"
import { AlertCircle, Loader2, ArrowLeft, Search as SearchIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialQuery = searchParams.get("q") || ""
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync state when URL params change (e.g. from header search)
  useEffect(() => {
    const q = searchParams.get("q") || ""
    setQuery(q)
    // REQUIREMENT 5: Automatic fetch on mount or param change
    if (q) {
      console.log("Auto-fetching results for:", q)
      fetchResults(q)
    }
  }, [searchParams])

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const currentQuery = query.trim()
    if (!currentQuery) return
    
    console.log("Search triggered:", currentQuery)
    console.log("Calling API with:", currentQuery)
    
    // Update URL to reflect the new search search
    router.push(`/search?q=${encodeURIComponent(currentQuery)}`, { scroll: false })
    fetchResults(currentQuery)
  }

  const fetchResults = async (q: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/products/search?q=${encodeURIComponent(q)}`)
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      if (data.success) {
        console.log("Results received:", data.products)
        setResults(data.products || [])
      } else {
        throw new Error(data.error || "Search failed")
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-6xl">
      <div className="flex flex-col gap-8">
        {/* Search Header */}
        <div className="flex flex-col gap-6">
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-gray-400 hover:text-primary transition-colors uppercase tracking-widest">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <h1 className="text-3xl md:text-5xl font-black text-gray-900 tracking-tight">
              Search <span className="text-primary">Results</span>
            </h1>
            <div className="w-full max-w-md">
              <form onSubmit={handleSearch}>
                <SearchInput
                  placeholder="Search products..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onClear={() => {
                    setQuery("")
                    router.replace("/search")
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                  className="h-14 shadow-lg shadow-primary/5"
                  autoFocus
                />
              </form>
            </div>
          </div>
        </div>

        {/* Results Info */}
        {!isLoading && query.trim() && (
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest pl-1">
            {results.length} {results.length === 1 ? 'Result' : 'Results'} for "{query}"
          </p>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
            <p className="text-sm text-gray-400 font-bold italic">Finding the best matches...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4 border-2 border-dashed border-red-50 rounded-[2.5rem] bg-red-50/10">
            <AlertCircle className="h-12 w-12 text-red-100" />
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-gray-900">Search encountered an error</h3>
              <p className="text-gray-500 font-medium italic">Please try refreshing the page or check your connection.</p>
            </div>
          </div>
        ) : query.trim() && results.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-6 border-2 border-dashed border-gray-50 rounded-[2.5rem] bg-gray-50/20">
            <div className="h-20 w-20 rounded-full bg-gray-50 flex items-center justify-center">
              <SearchIcon className="h-8 w-8 text-gray-200" />
            </div>
            <div className="space-y-1">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight text-center">No products found for "{query}"</h3>
              <p className="text-gray-500 font-medium italic text-center">Try checking your spelling or use more general keywords like "Chicken".</p>
            </div>
            <Button 
              variant="outline" 
              onClick={() => setQuery("Chicken")}
              className="rounded-xl border-2 border-gray-100 font-bold text-gray-400 hover:text-primary hover:border-primary/30 transition-all"
            >
              Try "Chicken"
            </Button>
          </div>
        ) : results.length > 0 ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : !query.trim() ? (
          <div className="flex flex-col items-center justify-center py-32 text-center gap-4 border-2 border-dashed border-gray-50 rounded-[2.5rem] bg-gray-50/10 grayscale opacity-40">
             <SearchIcon className="h-12 w-12 text-gray-100" />
             <p className="text-gray-400 font-bold italic">Enter a keyword above to start searching</p>
          </div>
        ) : null}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <main className="min-h-screen bg-white">
      <Navbar />
      <Suspense fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-12 w-12 animate-spin text-primary opacity-20" />
        </div>
      }>
        <SearchResults />
      </Suspense>
      <Footer />
    </main>
  )
}
