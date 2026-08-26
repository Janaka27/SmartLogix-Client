// Real product/warehouse ids from the one-off `scripts/seed.mjs` run.
// Cart/checkout use these so "Place Order" can write real order_items rows
// against real products instead of the old mock "p1".."p9" string ids.

export const SEED_WAREHOUSE_ID = "ff51088a-8b8c-4575-959d-f65565c8a342";

export const SEED_PRODUCTS = {
  p1: { id: "52de5fe0-3717-477c-b70d-e0b06478a300", weightKg: 0.4, volumeCm3: 960 },
  p2: { id: "6bd50a06-c359-4131-834c-1cd8bad4c8e9", weightKg: 0.3, volumeCm3: 2304 },
  p3: { id: "fda3b5fb-1768-4eb0-a6f3-6bb5fa2e2502", weightKg: 3.2, volumeCm3: 10240 },
  p4: { id: "4e52f488-06d0-4d31-8e0b-874806e1daa6", weightKg: 0.6, volumeCm3: 1200 },
  p5: { id: "01765f6c-c1fc-4757-bb80-dbbb8fb88993", weightKg: 0.5, volumeCm3: 1400 },
  p6: { id: "d1c2c64b-d35c-46f4-a857-66ba1a91ab98", weightKg: 0.2, volumeCm3: 192 },
  p7: { id: "6272c904-debd-4904-a5b0-744c82d0f38c", weightKg: 82.0, volumeCm3: 1_500_000 },
  p8: { id: "1d4c3c27-6711-449b-a01e-fe76b2745618", weightKg: 4.5, volumeCm3: 28_125 },
  p9: { id: "f4ba4fac-a8e2-4b44-a5ec-7c8ab8b06594", weightKg: 2.1, volumeCm3: 12_000 },
} as const;
