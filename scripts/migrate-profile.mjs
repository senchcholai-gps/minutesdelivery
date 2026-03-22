// Run this ONCE to add the missing columns to user_profiles
// Usage: node scripts/migrate-profile.mjs
//
// 1. Get your service_role key from: Supabase Dashboard → Settings → API
// 2. Set SUPABASE_SERVICE_ROLE_KEY in your .env.local
// 3. Run: node scripts/migrate-profile.mjs
// 4. Delete this file after success

import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error("❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

const sql = `
  alter table user_profiles
    add column if not exists full_name text,
    add column if not exists address_line1 text,
    add column if not exists address_line2 text,
    add column if not exists city text,
    add column if not exists state text,
    add column if not exists pincode text;
`;

const { error } = await supabase.rpc("exec_sql", { sql }).catch(() => ({ error: null }));

// Supabase doesn't have exec_sql RPC — use the admin REST API instead
const res = await fetch(`${url}/rest/v1/rpc/exec_sql`, {
  method: "POST",
  headers: {
    apikey: serviceKey,
    Authorization: `Bearer ${serviceKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({ query: sql }),
}).catch(() => null);

// The correct Supabase way: use the Management API
const projectRef = url.replace("https://", "").split(".")[0];
const mgmtRes = await fetch(
  `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${serviceKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  }
);

if (mgmtRes.ok) {
  console.log("✅ Migration successful! Columns added to user_profiles.");
} else {
  const err = await mgmtRes.text();
  console.error("❌ Migration failed:", err);
  console.log("\n📋 Run this SQL manually in Supabase Dashboard → SQL Editor:\n");
  console.log(sql);
}
