import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (!id) return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })

  let body: Record<string, any>
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON body" }, { status: 400 })
  }

  // Validate required fields
  if (!body.name || String(body.name).trim() === "") {
    return NextResponse.json({ success: false, message: "Product name is required" }, { status: 400 })
  }

  // Validate variant_options
  const variant_options = Array.isArray(body.variant_options) ? body.variant_options : []
  if (variant_options.length === 0) {
    return NextResponse.json({ success: false, message: "At least one variant is required" }, { status: 400 })
  }
  for (const v of variant_options) {
    if (!v.label || typeof v.price !== "number" || v.price <= 0) {
      return NextResponse.json({ success: false, message: `Invalid variant: ${JSON.stringify(v)}` }, { status: 400 })
    }
  }

  // null means "use global rule" (default ₹25); only parse when a real number is provided
  const delivery_charge = (body.delivery_charge === null || body.delivery_charge === undefined)
    ? 25
    : parseFloat(body.delivery_charge)
  if (isNaN(delivery_charge) || delivery_charge < 0) {
    return NextResponse.json({ success: false, message: "Delivery charge must be 0 or greater" }, { status: 400 })
  }

  const updatePayload: Record<string, any> = {
    name: String(body.name).trim(),
    description: body.description ? String(body.description).trim() : null,
    category_id: body.category_id || null,
    image: body.image ? String(body.image).trim() : null,
    availability: body.availability || "in_stock",
    delivery_charge,
    variant_options,
  }

  try {
    const db = createServiceClient()

    const { data: existing, error: checkError } = await db
      .from("products")
      .select("id")
      .eq("id", id)
      .single()

    if (checkError || !existing) {
      return NextResponse.json({ success: false, message: "Product not found" }, { status: 404 })
    }

    const { data, error } = await db
      .from("products")
      .update(updatePayload)
      .eq("id", id)
      .select("*, categories ( id, name )")
      .single()

    if (error) throw error

    return NextResponse.json({ success: true, data }, { status: 200 })
  } catch (error: any) {
    console.error("[AdminProducts PATCH]", error.message)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

  const { id } = await params
  if (!id) return NextResponse.json({ success: false, message: "Product ID is required" }, { status: 400 })

  try {
    const db = createServiceClient()
    const { error } = await db.from("products").delete().eq("id", id)
    if (error) throw error
    return NextResponse.json({ success: true, message: "Product deleted" }, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
