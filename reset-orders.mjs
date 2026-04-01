import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function resetOrders() {
  console.log("Deleting order items...");
  const { error: err1, count: c1 } = await db.from("order_items").delete().not("id", "is", null).select();
  if (err1) console.error("Error deleting order items:", err1);
  else console.log(`Deleted ${c1?.length || 0} order items.`);

  console.log("Deleting orders...");
  const { error: err2, count: c2 } = await db.from("orders").delete().not("id", "is", null).select();
  if (err2) console.error("Error deleting orders:", err2);
  else console.log(`Deleted ${c2?.length || 0} orders.`);

  console.log("Reset complete.");
}

resetOrders();
