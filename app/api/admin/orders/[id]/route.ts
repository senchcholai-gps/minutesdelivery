import { NextResponse } from "next/server"
import { verifyAdmin, createServiceClient } from "@/lib/adminCheck"

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { admin } = await verifyAdmin(request)
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  try {
    const { status } = await request.json()
    const db = createServiceClient()
    const { data, error } = await db
      .from("orders")
      .update({ status })
      .eq("id", params.id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (error: any) {
    console.error("[AdminOrders PATCH]", error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
