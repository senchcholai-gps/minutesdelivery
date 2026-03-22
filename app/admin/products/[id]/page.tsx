"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Save, Loader2, Plus, Trash2, ImagePlus, X } from "lucide-react"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { supabase } from "@/lib/supabaseClient"
import toast from "react-hot-toast"
import { ImageCropModal } from "@/components/ImageCropModal"

interface Variant { label: string; price: number }

interface FormState {
  name: string
  description: string
  category_id: string
  image: string
  delivery_charge: string
  delivery_type: string
  availability: string
  variant_options: Variant[]
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [categories, setCategories] = useState<any[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)

  // Crop flow state
  const [rawSrc, setRawSrc] = useState<string | null>(null)
  const [showCropper, setShowCropper] = useState(false)
  const [croppedBlob, setCroppedBlob] = useState<Blob | null>(null)
  const [croppedPreview, setCroppedPreview] = useState<string | null>(null)

  const [formData, setFormData] = useState<FormState>({
    name: "",
    description: "",
    category_id: "",
    image: "",
    delivery_charge: "25",
    delivery_type: "chargeable",
    availability: "in_stock",
    variant_options: [],
  })

  const [newVariantLabel, setNewVariantLabel] = useState("")
  const [newVariantPrice, setNewVariantPrice] = useState("")

  useEffect(() => {
    async function fetchData() {
      try {
        const [catRes, prodRes] = await Promise.all([
          fetch("/api/categories"),
          fetch(`/api/products/${params.id}`)
        ])
        if (!catRes.ok) throw new Error("Failed to fetch categories")
        if (!prodRes.ok) throw new Error("Product not found")

        const cats = await catRes.json()
        const product = await prodRes.json()

        setCategories(Array.isArray(cats) ? cats : [])
        setFormData({
          name: product.name || "",
          description: product.description || "",
          category_id: product.category_id || "",
          image: product.image || "",
          delivery_charge: String(product.delivery_charge ?? ""),
          delivery_type: product.delivery_charge === 0 ? "free" : "global",
          availability: product.availability || "in_stock",
          variant_options: Array.isArray(product.variant_options) ? product.variant_options : [],
        })
      } catch (err: any) {
        toast.error(err.message || "Failed to load product")
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [params.id])

  // Cleanup
  useEffect(() => {
    return () => {
      if (rawSrc) URL.revokeObjectURL(rawSrc)
      if (croppedPreview) URL.revokeObjectURL(croppedPreview)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
    if (!validTypes.includes(file.type)) {
      toast.error("Only JPG, PNG, or WebP images are allowed.")
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File too large. Maximum size is 5MB.")
      return
    }

    if (rawSrc) URL.revokeObjectURL(rawSrc)
    if (croppedPreview) URL.revokeObjectURL(croppedPreview)
    setCroppedBlob(null)
    setCroppedPreview(null)

    const src = URL.createObjectURL(file)
    setRawSrc(src)
    setShowCropper(true)
    e.target.value = ""
  }

  const handleCropComplete = (blob: Blob, preview: string) => {
    setCroppedBlob(blob)
    setCroppedPreview(preview)
    setShowCropper(false)
  }

  const handleCropCancel = () => {
    setShowCropper(false)
    if (rawSrc) { URL.revokeObjectURL(rawSrc); setRawSrc(null) }
  }

  const handleClearNewImage = () => {
    setCroppedBlob(null)
    if (croppedPreview) { URL.revokeObjectURL(croppedPreview); setCroppedPreview(null) }
    if (rawSrc) { URL.revokeObjectURL(rawSrc); setRawSrc(null) }
  }

  const handleAddVariant = () => {
    if (!newVariantLabel.trim()) { toast.error("Variant label is required"); return }
    const price = parseFloat(newVariantPrice)
    if (isNaN(price) || price <= 0) { toast.error("Enter a valid price"); return }
    if (formData.variant_options.some(v => v.label === newVariantLabel.trim())) {
      toast.error("Variant label already exists"); return
    }
    setFormData(f => ({ ...f, variant_options: [...f.variant_options, { label: newVariantLabel.trim(), price }] }))
    setNewVariantLabel("")
    setNewVariantPrice("")
  }

  const handleRemoveVariant = (label: string) => {
    setFormData(f => ({ ...f, variant_options: f.variant_options.filter(v => v.label !== label) }))
  }

  const handleVariantPriceChange = (label: string, newPrice: string) => {
    setFormData(f => ({
      ...f,
      variant_options: f.variant_options.map(v => v.label === label ? { ...v, price: parseFloat(newPrice) || 0 } : v)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) { toast.error("Product name is required"); return }
    if (formData.variant_options.length === 0) { toast.error("Add at least one variant"); return }

    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    if (!token) { toast.error("Not authenticated"); return }

    setIsSaving(true)
    try {
      // Step 1: Upload newly cropped image if available
      let imagePath: string | null = formData.image || null
      if (croppedBlob) {
        setIsUploading(true)
        const uploadForm = new FormData()
        uploadForm.append("image", croppedBlob, `product-${Date.now()}.jpg`)
        const uploadRes = await fetch("/api/admin/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: uploadForm,
        })
        setIsUploading(false)
        if (!uploadRes.ok) {
          const errData = await uploadRes.json()
          throw new Error(errData.error || "Image upload failed")
        }
        const { path } = await uploadRes.json()
        imagePath = path
      }

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        category_id: formData.category_id || null,
        image: imagePath,
        delivery_charge: formData.delivery_type === "free" ? 0 : null,
        availability: formData.availability,
        variant_options: formData.variant_options,
      }

      const res = await fetch(`/api/admin/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })

      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.message || "Update failed")

      toast.success("Product updated successfully!")
      setTimeout(() => router.push("/admin/products"), 1000)
    } catch (err: any) {
      toast.error(err.message || "Update failed")
    } finally {
      setIsSaving(false)
      setIsUploading(false)
    }
  }

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="h-10 w-10 animate-spin text-primary opacity-30" />
    </div>
  )

  const currentDbImage = formData.image

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

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto max-w-3xl px-4 py-10">
          <button
            onClick={() => router.push("/admin/products")}
            className="mb-8 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-primary transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Products
          </button>

          <h1 className="text-3xl font-black text-gray-900 tracking-tight mb-8">Edit Product</h1>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div className="bg-white p-6 rounded-2xl shadow-sm space-y-5">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider">Basic Info</h2>

              <div>
                <Label htmlFor="name" className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Product Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Chicken Breast"
                  className="rounded-xl"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description" className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  placeholder="Product description..."
                  rows={3}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Category</Label>
                  <Select value={formData.category_id} onValueChange={v => setFormData(f => ({ ...f, category_id: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      {categories.map(cat => <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1.5 block">Availability</Label>
                  <Select value={formData.availability} onValueChange={v => setFormData(f => ({ ...f, availability: v }))}>
                    <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="in_stock">In Stock</SelectItem>
                      <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 block mb-2">Delivery Mode</Label>
                <Select value={formData.delivery_type} onValueChange={v => setFormData(f => ({ ...f, delivery_type: v }))}>
                  <SelectTrigger className="rounded-xl h-12 border-gray-100 bg-gray-50/50"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="global" className="font-bold">Use Global Rule (Default)</SelectItem>
                    <SelectItem value="free" className="text-primary font-bold italic">Free Delivery</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-gray-400 italic">
                  {formData.delivery_type === "global" ? "Follows Admin Settings (₹25 unless threshold reached)" : "This product always ships for free."}
                </p>
              </div>

              {/* ── Image Upload with Crop ── */}
              <div className="space-y-3">
                <Label className="text-xs font-black uppercase tracking-widest text-gray-400 block">Product Image</Label>

                {/* Newly cropped preview (takes priority) */}
                {croppedPreview ? (
                  <div className="flex items-start gap-4">
                    <div className="relative group w-40 h-40 rounded-2xl overflow-hidden border-2 border-primary/30 shadow-lg flex-shrink-0">
                      <Image src={croppedPreview} alt="New preview" fill className="object-cover" />
                      <button
                        type="button"
                        onClick={handleClearNewImage}
                        className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex flex-col gap-2 pt-1">
                      <p className="text-sm font-bold text-green-600">✅ New image cropped (800×800)</p>
                      <p className="text-xs text-gray-400">Will replace current image on save</p>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-xs font-bold text-primary underline underline-offset-2 hover:opacity-70 transition-opacity"
                      >
                        Replace image
                      </button>
                    </div>
                  </div>
                ) : currentDbImage ? (
                  /* Current DB image */
                  <div className="space-y-2">
                    <p className="text-xs text-gray-400 font-medium">Current image:</p>
                    <div className="flex items-start gap-4">
                      <div className="relative w-40 h-40 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm flex-shrink-0">
                        <Image
                          src={currentDbImage}
                          alt="Current product image"
                          fill
                          className="object-cover"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = "none" }}
                        />
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Upload / change button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 hover:border-primary/40 hover:bg-primary/5 transition-all text-sm font-bold text-gray-400 hover:text-primary/70 w-full justify-center"
                >
                  <ImagePlus className="h-4 w-4" />
                  {croppedPreview ? "Change image" : currentDbImage ? "Upload new image" : "Upload & crop image"}
                </button>
                <p className="text-[10px] text-gray-400 italic ml-1">
                  JPG, PNG, WebP · max 5MB · Output: 800×800px square · Leave unchanged to keep current image
                </p>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Variant Options */}
            <div className="bg-white p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-lg font-black text-gray-800 uppercase tracking-wider">
                Variant Options <span className="text-xs text-gray-400 normal-case font-medium ml-2">(e.g. 500g, 1kg with prices)</span>
              </h2>

              {formData.variant_options.length > 0 ? (
                <div className="space-y-2">
                  {formData.variant_options.map(v => (
                    <div key={v.label} className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <span className="text-sm font-black text-gray-700 w-16">{v.label}</span>
                      <span className="text-gray-400 text-sm">₹</span>
                      <Input type="number" min="1" value={v.price} onChange={e => handleVariantPriceChange(v.label, e.target.value)} className="rounded-lg h-8 text-sm w-24" />
                      <button type="button" onClick={() => handleRemoveVariant(v.label)} className="ml-auto h-8 w-8 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No variants yet. Add one below.</p>
              )}

              <div className="flex items-end gap-2 pt-2 border-t border-gray-100">
                <div className="flex-1">
                  <Label className="text-xs font-bold text-gray-400 mb-1 block">Label (e.g. 500g)</Label>
                  <Input value={newVariantLabel} onChange={e => setNewVariantLabel(e.target.value)} placeholder="500g" className="rounded-xl h-9 text-sm" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-gray-400 mb-1 block">Price (₹)</Label>
                  <Input type="number" min="1" value={newVariantPrice} onChange={e => setNewVariantPrice(e.target.value)} placeholder="120" className="rounded-xl h-9 text-sm w-28" />
                </div>
                <Button type="button" onClick={handleAddVariant} variant="outline" className="h-9 rounded-xl border-primary text-primary hover:bg-primary/5 font-black">
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Save */}
            <Button type="submit" disabled={isSaving} className="w-full h-14 rounded-2xl bg-primary text-white font-black text-lg shadow-lg shadow-primary/20 transition-all active:scale-[0.98] gap-3">
              {isSaving ? (
                <><Loader2 className="h-5 w-5 animate-spin" /> {isUploading ? "Uploading..." : "Saving..."}</>
              ) : (
                <><Save className="h-5 w-5" /> Save Product</>
              )}
            </Button>
          </form>
        </div>
      </div>
    </>
  )
}
