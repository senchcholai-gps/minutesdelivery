import { createServiceClient } from "./lib/adminCheck"

async function debugSchema() {
  const db = createServiceClient()
  const { data, error } = await db.from("products").select("*").limit(1)
  if (error) {
    console.error("Error fetching product:", error)
  } else {
    console.log("Product columns:", Object.keys(data[0] || {}))
  }
}

debugSchema()
