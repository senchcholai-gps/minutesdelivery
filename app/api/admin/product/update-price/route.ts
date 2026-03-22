import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

export async function POST(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const body = await request.json()
    const { productId, price } = body

    if (!productId) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 })
    }

    const numericPrice = parseFloat(price)
    if (isNaN(numericPrice) || numericPrice <= 0) {
      return NextResponse.json({ error: "Price must be a valid positive number" }, { status: 400 })
    }

    const db = createServiceClient()
    
    // Verify product exists
    const { data: existing, error: checkError } = await db
      .from("products")
      .select("id")
      .eq("id", productId)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 })
    }

    // Update the database
    const { data: updatedProduct, error } = await db
      .from("products")
      .update({ price: numericPrice })
      .eq("id", productId)
      .select(`*, categories ( id, name )`)
      .single()

    if (error) throw error
    return NextResponse.json(updatedProduct)
  } catch (error: any) {
    console.error("[AdminProductPriceUpdate POST]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
