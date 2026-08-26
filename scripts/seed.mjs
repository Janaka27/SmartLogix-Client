// One-off dev seed script: creates a seller account + profile + a handful of
// real products so the connected frontend has something to show.
// Run with: node scripts/seed.mjs
// Requires SUPABASE_URL + SUPABASE_SECRET_KEY (read from .env.local).

import { readFileSync } from "node:fs";

function loadEnvLocal() {
  const text = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
  const env = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = loadEnvLocal();
const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SECRET_KEY = env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SECRET_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local");
  process.exit(1);
}

const headers = {
  apikey: SECRET_KEY,
  Authorization: `Bearer ${SECRET_KEY}`,
  "Content-Type": "application/json",
};

async function rest(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}), Prefer: "return=representation" },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`REST ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function authAdmin(path, options = {}) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/${path}`, {
    ...options,
    headers: { ...headers, ...(options.headers || {}) },
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`AUTH ${path} -> ${res.status}: ${text}`);
  return text ? JSON.parse(text) : null;
}

async function main() {
  console.log("1/5 Checking for existing seed warehouse...");
  let [warehouse] = await rest("warehouses?name=eq.SmartLogix%20Central%20Warehouse&select=*");
  if (!warehouse) {
    [warehouse] = await rest("warehouses", {
      method: "POST",
      body: JSON.stringify({
        name: "SmartLogix Central Warehouse",
        is_seller_facing: true,
        latitude: 6.9271,
        longitude: 79.8612,
        capacity: 5000,
        drone_dock_count: 8,
        charging_station: true,
      }),
    });
  }
  console.log("   warehouse id:", warehouse.id);

  console.log("2/5 Ensuring seed seller auth user exists...");
  const sellerEmail = "seller@smartlogix.demo";
  const sellerPassword = "SmartLogixDemo123!";
  let sellerUserId;
  const existingUsers = await authAdmin(`users?email=${encodeURIComponent(sellerEmail)}`);
  if (existingUsers?.users?.length) {
    sellerUserId = existingUsers.users[0].id;
    console.log("   seller user already exists:", sellerUserId);
  } else {
    const created = await authAdmin("users", {
      method: "POST",
      body: JSON.stringify({ email: sellerEmail, password: sellerPassword, email_confirm: true }),
    });
    sellerUserId = created.id;
    console.log("   created seller user:", sellerUserId);
  }

  console.log("3/5 Ensuring seller profile + seller_profiles row...");
  let [profile] = await rest(`profiles?id=eq.${sellerUserId}&select=*`);
  if (!profile) {
    [profile] = await rest("profiles", {
      method: "POST",
      body: JSON.stringify({
        id: sellerUserId,
        role: "seller",
        full_name: "SmartLogix Marketplace",
        email: sellerEmail,
      }),
    });
  }
  let [sellerProfile] = await rest(`seller_profiles?profile_id=eq.${sellerUserId}&select=*`);
  if (!sellerProfile) {
    [sellerProfile] = await rest("seller_profiles", {
      method: "POST",
      body: JSON.stringify({
        profile_id: sellerUserId,
        store_name: "SmartLogix Marketplace",
        description: "Official seed catalog for the SmartLogix demo storefront.",
        status: "approved",
      }),
    });
  }
  console.log("   seller_profiles id:", sellerProfile.id);

  console.log("4/5 Seeding products (skips ones that already exist by name)...");
  const PRODUCTS = [
    { key: "p1", name: "Phone Stand Sakti", category: "For Phone", price: 29.9, weight_kg: 0.4, length_cm: 12, width_cm: 8, height_cm: 10, stock_qty: 40 },
    { key: "p2", name: "Headsound Pro", category: "For Music", price: 12.0, weight_kg: 0.3, length_cm: 18, width_cm: 16, height_cm: 8, stock_qty: 60 },
    { key: "p3", name: "Adudu Cleaner", category: "For Home", price: 29.9, weight_kg: 3.2, length_cm: 32, width_cm: 32, height_cm: 10, stock_qty: 15 },
    { key: "p4", name: "CCTV Maling", category: "For Home", price: 50.0, weight_kg: 0.6, length_cm: 10, width_cm: 10, height_cm: 12, stock_qty: 25 },
    { key: "p5", name: "Stuffus Peker 32", category: "For Storage", price: 9.9, weight_kg: 0.5, length_cm: 10, width_cm: 10, height_cm: 14, stock_qty: 80 },
    { key: "p6", name: "Stuffus R175", category: "For Music", price: 34.1, weight_kg: 0.2, length_cm: 8, width_cm: 6, height_cm: 4, stock_qty: 50 },
    { key: "p7", name: "Grand Sound Piano", category: "For Music", price: 249.0, weight_kg: 82.0, length_cm: 150, width_cm: 100, height_cm: 100, stock_qty: 3 },
    { key: "p8", name: "Aer Purifier X1", category: "For Home", price: 79.0, weight_kg: 4.5, length_cm: 25, width_cm: 25, height_cm: 45, stock_qty: 12 },
    { key: "p9", name: "Brewkit Coffee Maker", category: "For Home", price: 45.0, weight_kg: 2.1, length_cm: 20, width_cm: 20, height_cm: 30, stock_qty: 20 },
  ];

  const idMap = {};
  for (const p of PRODUCTS) {
    let [existing] = await rest(`products?name=eq.${encodeURIComponent(p.name)}&select=id`);
    if (!existing) {
      [existing] = await rest("products", {
        method: "POST",
        body: JSON.stringify({
          seller_id: sellerUserId,
          warehouse_id: warehouse.id,
          name: p.name,
          description: `${p.name} — demo listing seeded for SmartLogix.`,
          category: p.category,
          price: p.price,
          stock_qty: p.stock_qty,
          weight_kg: p.weight_kg,
          length_cm: p.length_cm,
          width_cm: p.width_cm,
          height_cm: p.height_cm,
          fragile: false,
          images: [],
          status: "active",
        }),
      });
      console.log(`   inserted ${p.name}`);
    } else {
      console.log(`   already exists: ${p.name}`);
    }
    idMap[p.key] = existing.id;
  }

  console.log("5/5 Done. Product id map:");
  console.log(JSON.stringify(idMap, null, 2));
  console.log("\nWarehouse id:", warehouse.id);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
