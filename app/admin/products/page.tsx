"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Plus, Edit, Trash2, Search, Filter, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { SearchInput } from "@/components/SearchInput"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

export default function AdminProductsPage() {
  const { toast } = useToast()
  const [products, setProducts] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [availabilityFilter, setAvailabilityFilter] = useState("all")
  const [isDeleting, setIsDeleting] = useState<string | null>(null)

  const fetchProducts = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        if (!silent) setIsLoading(false)
        return
      }

      const res = await fetch("/api/admin/products", {
        headers: {
          "Authorization": `Bearer ${session?.access_token}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch products")
      const data = await res.json()
      setProducts(data)
    } catch (error: any) {
      if (!silent) toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProducts(false)
    const intervalId = setInterval(() => fetchProducts(true), 5000)
    return () => clearInterval(intervalId)
  }, [])

  const handleDelete = async (id: string) => {
    setIsDeleting(id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session?.access_token}`
        }
      })
      if (!res.ok) throw new Error("Failed to delete product")
      
      setProducts(products.filter(p => p.id !== id))
      toast({
        title: "Success",
        description: "Product deleted successfully",
      })
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      })
    } finally {
      setIsDeleting(null)
    }
  }

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.categories?.name || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchAvail = availabilityFilter === "all" || p.availability === availabilityFilter
    return matchSearch && matchAvail
  })

  return (
    <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Product Inventory</h2>
            <p className="text-sm text-gray-500">Manage your product catalog, prices, and stock levels.</p>
          </div>
          <Link href="/admin/products/new">
            <Button className="bg-primary hover:bg-primary/90 shadow-sm gap-2">
              <Plus className="h-4 w-4" />
              Add New Product
            </Button>
          </Link>
        </div>

      <div className="flex items-center justify-between gap-4 bg-white p-4 rounded-xl border shadow-sm flex-wrap">
        <div className="basis-[70%] min-w-[250px]">
          <SearchInput
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery("")}
            className="w-full h-10 shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={availabilityFilter}
            onChange={e => setAvailabilityFilter(e.target.value)}
            className="text-sm border border-gray-100 rounded-xl px-4 h-10 bg-gray-50 text-gray-700 font-bold cursor-pointer focus:outline-none shadow-sm min-w-[140px]"
          >
            <option value="all">All Status</option>
            <option value="in_stock">In Stock</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50/50 border-b">
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Variants & Prices</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-20" />
                      <p className="mt-4 text-sm text-gray-400 italic">Syncing inventory...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <AlertCircle className="h-12 w-12 opacity-10 mb-4" />
                      <p className="text-lg font-medium italic">No products found</p>
                      <p className="text-sm mt-1">Try adjusting your search or add a new product.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-lg bg-muted relative overflow-hidden border border-gray-100 flex-shrink-0">
                          <Image
                            src={product.image || "/images/placeholder.jpg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900 leading-tight">{product.name}</p>
                          <p className="text-xs text-gray-400 mt-0.5">ID: {product.id.slice(0, 8)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className="bg-gray-100/50 border-gray-100 text-gray-600 font-medium">
                        {product.categories?.name || "Uncategorized"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {Array.isArray(product.variant_options) && product.variant_options.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {product.variant_options.map((v: any) => (
                            <span key={v.label} className="px-2 py-0.5 rounded-lg bg-primary/5 text-primary text-[11px] font-black border border-primary/10">
                              {v.label} ₹{v.price}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-300 text-xs italic">No variants</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                        product.availability === "out_of_stock"
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-primary/10 text-primary border-primary/20'
                      }`}>
                        {product.availability === "out_of_stock" ? "Out of Stock" : "In Stock"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-primary hover:bg-primary/5 transition-colors">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-2xl font-bold tracking-tight">Delete Product?</AlertDialogTitle>
                              <AlertDialogDescription className="text-gray-500 font-medium italic">
                                Are you sure you want to delete <span className="text-gray-900 font-bold not-italic">{product.name}</span>? This action cannot be undone and will remove the product from the storefront.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="gap-3">
                              <AlertDialogCancel className="rounded-xl border-gray-100 transition-all hover:bg-gray-100">Cancel</AlertDialogCancel>
                              <AlertDialogAction 
                                onClick={() => handleDelete(product.id)}
                                className="bg-red-600 hover:bg-red-700 rounded-xl transition-all shadow-lg shadow-red-100"
                              >
                                {isDeleting === product.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Delete Product"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
