"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, Save, Loader2, ImagePlus, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { supabase } from "@/lib/supabaseClient"
import Image from "next/image"
import { ImageCropModal } from "@/components/ImageCropModal"

export default function AddProductPage() {
  const router = useRouter()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoadingCats, setIsLoadingCats] = useState(true)

  // Raw file src (object URL) shown to the cropper
  const [rawSrc, setRawSrc] = useState<string | null>(null)
  
  // Cropped blob + preview
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)

  const [formData, setFormData] = useState({
    name: "",
    price: "",
    quantity: "50",
    description: "",
    category_id: "",
    delivery_type: "global",
  })

  useEffect(() => {
    async function fetchCategories() {
      try {
        const res = await fetch("/api/categories")
        if (res.ok) setCategories(await res.json())
      } catch (error) {
        console.error("Error fetching categories:", error)
      } finally {
        setIsLoadingCats(false)
      }
    }
    fetchCategories()
  }, [])

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (rawSrc) URL.revokeObjectURL(rawSrc)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast({ variant: "destructive", title: "Invalid file", description: "Only JPG, PNG, or WebP images are allowed." })
      return
    }
    // Size check
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: "File too large", description: "Maximum image size is 5MB." })
      return
    }

    // Clear previous
    if (rawSrc) URL.revokeObjectURL(rawSrc)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setCroppedBlob(null)
    setPreviewUrl(null)

    const src = URL.createObjectURL(file)
    setRawSrc(src)
    setShowCropper(true)

    // Reset input so the same file can be re-selected
    e.target.value = ""
  }

  const handleCropComplete = (blob: Blob, preview: string) => {
    setCroppedBlob(blob)
    setPreviewUrl(preview)
    setShowCropper(false)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    if (rawSrc) { URL.revokeObjectURL(rawSrc); setRawSrc(null) }
  }

  const handleClearImage = () => {
    setCroppedBlob(null)
    if (previewUrl) { URL.revokeObjectURL(previewUrl); setPreviewUrl(null) }
    if (rawSrc) { URL.revokeObjectURL(rawSrc); setRawSrc(null) }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) throw new Error("Not authenticated")

      if (!croppedBlob) {
        throw new Error("Product image is required")
      }

      if (!formData.name || !formData.price || !formData.category_id || !formData.quantity) {
        throw new Error("Please fill in all required fields")
      }

      const payload = new FormData()
      payload.append("name", formData.name)
      payload.append("price", formData.price)
      payload.append("category", formData.category_id)
      payload.append("quantity", formData.quantity)
      payload.append("description", formData.description)
      payload.append("delivery_type", formData.delivery_type)
      
      // Append the cropped image file directly. 
      // Name it something standard so Multer/route handles it gracefully
      payload.append("image", croppedBlob, `product-${Date.now()}.jpg`)

      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: { 
          Authorization: `Bearer ${token}` 
        },
        body: payload,
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to add product")
      }

      toast({ title: "Product added successfully", description: "New product has been added to the inventory." })
      
      // Navigate on success
      router.push("/admin/products")
    } catch (error: any) {
      toast({ variant: "destructive", title: "Failed to add product", description: error.message })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <>
      {/* Crop Modal */}
      {showCropper && rawSrc && (
        <ImageCropModal
          imageSrc={rawSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}

      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full h-10 w-10 border shadow-sm bg-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Add New Product</h2>
            <p className="text-sm text-gray-500 italic">Create a new item for your storefront.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-xl ring-1 ring-gray-100 overflow-hidden">
            <CardHeader className="bg-gray-50/50 border-b">
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about the product.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-700 font-bold ml-1">Product Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Premium Chicken Breast"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category" className="text-gray-700 font-bold ml-1">Category *</Label>
                  <Select onValueChange={(val) => setFormData({ ...formData, category_id: val })} required>
                    <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all">
                      <SelectValue placeholder={isLoadingCats ? "Loading..." : "Select Category"} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-2xl">
                      {categories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id} className="rounded-lg">{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="price" className="text-gray-700 font-bold ml-1">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="1"
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all font-bold text-primary"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="quantity" className="text-gray-700 font-bold ml-1">Quantity *</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="1"
                    placeholder="50"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    required
                    className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all"
                  />
                </div>
              </div>

              {/* Description textarea */}
              <div className="space-y-2 pt-2">
                <Label htmlFor="description" className="text-gray-700 font-bold ml-1">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the product (freshness, use cases, etc.)..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-4">
                <Label className="text-gray-700 font-bold ml-1">Delivery Mode</Label>
                <Select value={formData.delivery_type} onValueChange={(val) => setFormData({ ...formData, delivery_type: val })}>
                  <SelectTrigger className="rounded-xl border-gray-100 bg-gray-50 focus:bg-white transition-all">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="global" className="font-bold">Use Global Rule (Default)</SelectItem>
                    <SelectItem value="free" className="text-primary font-bold italic">Free Delivery</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-gray-400 italic ml-1">
                  {formData.delivery_type === "global" ? "Standard rules apply (Free above threshold)." : "Product always delivers for free regardless of total."}
                </p>
              </div>

              {/* ── Image Upload with Crop ── */}
              <div className="space-y-3">
                <Label className="text-gray-700 font-bold ml-1">Product Image *</Label>

                {previewUrl ? (
                  <div className="flex items-start gap-4">
                    <div className="relative group w-40 h-40 rounded-2xl overflow-hidden border-2 border-primary/20 shadow-lg flex-shrink-0">
                      <Image src={previewUrl} alt="Preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={handleClearImage}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <p className="text-sm font-bold text-gray-700">✅ Image cropped (800×800)</p>
                      <p className="text-xs text-gray-400">Ready to upload on save</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
                      >
                        Replace image
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center justify-center w-full h-36 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-primary/5 transition-all group cursor-pointer"
                  >
                    <ImagePlus className="h-8 w-8 text-gray-300 group-hover:text-primary/50 transition-colors mb-2" />
                    <span className="text-sm font-bold text-gray-400 group-hover:text-primary/70 transition-colors">Click to upload &amp; crop image</span>
                    <span className="text-xs text-gray-300 mt-1">JPG, PNG, WebP · max 5MB · Output: 800×800px square</span>
                  </button>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center justify-end gap-4">
            <Button variant="ghost" type="button" onClick={() => router.back()} disabled={isSaving} className="font-bold underline decoration-primary/20 hover:decoration-primary">
              Discard Changes
            </Button>
            <Button type="submit" disabled={isSaving || isLoadingCats} className="rounded-2xl px-10 py-6 text-lg font-bold shadow-xl bg-accent text-accent-foreground transition-all hover:scale-105 active:scale-95">
              {isSaving ? (
                <>
                  <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-3 h-6 w-6" />
                  Save Product
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  )
}
