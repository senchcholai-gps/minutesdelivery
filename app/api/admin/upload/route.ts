import { NextResponse } from "next/server"
import { verifyAdmin } from "@/lib/adminCheck"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

export const runtime = "nodejs"

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"]
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5MB

export async function POST(request: Request) {
  const { admin } = await verifyAdmin(request)
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get("image") as File | null

    if (!file || file.size === 0) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Only JPG, PNG, and WebP are allowed." },
        { status: 400 }
      )
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File too large. Maximum allowed size is 5MB." },
        { status: 400 }
      )
    }

    // Build safe filename: timestamp + sanitised original name
    const originalName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")
    const filename = `${Date.now()}-${originalName}`

    // Ensure the uploads directory exists
    const uploadsDir = path.join(process.cwd(), "public", "uploads")
    await mkdir(uploadsDir, { recursive: true })

    // Write the file to disk
    const buffer = Buffer.from(await file.arrayBuffer())
    await writeFile(path.join(uploadsDir, filename), buffer)

    const imagePath = `/uploads/${filename}`
    return NextResponse.json({ path: imagePath }, { status: 200 })
  } catch (error: any) {
    console.error("[Upload POST]", error.message)
    return NextResponse.json({ error: "Failed to upload image" }, { status: 500 })
  }
}
