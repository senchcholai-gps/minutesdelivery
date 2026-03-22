import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const runtime = "nodejs"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export async function GET(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const db = createServiceClient()
    const { data, error } = await db
      .from("products")
      .select(`*, categories ( name )`)
      .order("created_at", { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[AdminProducts GET]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const formData = await request.formData()

    // 1. Extract non-file fields
    const name = formData.get("name")?.toString()?.trim()
    const priceStr = formData.get("price")?.toString()?.trim()
    const category_id = formData.get("category")?.toString()?.trim() || null
    const quantityStr = formData.get("quantity")?.toString()?.trim()
    const description = formData.get("description")?.toString()?.trim() || null
    const delivery_type = formData.get("delivery_type")?.toString()?.trim() || "global"
    const file = formData.get("image") as File | null

    // Validations
    if (!name) return NextResponse.json({ error: "Product name is required" }, { status: 400 })
    if (!priceStr || isNaN(parseFloat(priceStr))) return NextResponse.json({ error: "Valid price is required" }, { status: 400 })
    if (!quantityStr || isNaN(parseInt(quantityStr))) return NextResponse.json({ error: "Valid quantity is required" }, { status: 400 })
    if (!file || file.size === 0) return NextResponse.json({ error: "Product image is required" }, { status: 400 })

    const price = parseFloat(priceStr)
    const stock = parseInt(quantityStr) // Map quantity to stock
    const delivery_charge = delivery_type === "free" ? 0 : 25

    // 2. Handle image upload
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid image type. Only JPG, PNG, WebP allowed." }, { status: 400 })
    }
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Maximum size is 5MB." }, { status: 400 })
    }

    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const filename = `${Date.now()}-${originalName}`
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    
    await mkdir(uploadsDir, { recursive: true })
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadsDir, filename), buffer)
    
    const imagePath = `/uploads/${filename}`

    // 3. Save to database
    const db = createServiceClient()
    const insertPayload = {
      name,
      price,
      category_id,
      stock,           // Save the quantity input into 'stock'
      description,
      delivery_charge,
      image: imagePath,
      availability: stock > 0 ? "in_stock" : "out_of_stock",
      variant_options: [] // Provide empty variants array if table requires jsonb
    }

    const { data: product, error } = await db
      .from("products")
      .insert([insertPayload])
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, product }, { status: 201 })
  } catch (error: any) {
    console.error("[AdminProducts POST]", error.message)
    return NextResponse.json({ error: "Failed to add product: " + error.message }, { status: 500 })
  }
}
