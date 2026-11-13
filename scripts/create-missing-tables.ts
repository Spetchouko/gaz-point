import "dotenv/config"
import { neon } from "@neondatabase/serverless"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) { console.log("DATABASE_URL missing"); process.exit(1) }
  const sql = neon(url)

  // Create point_de_vente table
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "point_de_vente" (
        "id" text PRIMARY KEY NOT NULL,
        "name" text NOT NULL,
        "district" text NOT NULL,
        "address" text NOT NULL,
        "phone" text,
        "brands" text[] DEFAULT '{}'::text[] NOT NULL,
        "formats" text[] DEFAULT '{}'::text[] NOT NULL,
        "delivery_enabled" boolean DEFAULT false NOT NULL,
        "delivery_fee" integer DEFAULT 0 NOT NULL,
        "exchange_enabled" boolean DEFAULT false NOT NULL,
        "exchange_brands" text[] DEFAULT '{}'::text[] NOT NULL,
        "exchange_formats" text[] DEFAULT '{}'::text[] NOT NULL,
        "gas_sale_enabled" boolean DEFAULT false NOT NULL,
        "vendor_id" text REFERENCES "user"("id") ON DELETE SET NULL,
        "is_active" boolean DEFAULT true NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `)
    console.log("OK: point_de_vente table created")
  } catch (e: any) {
    console.log("WARN point_de_vente table:", e.message)
  }

  // Create indexes
  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_vendor_id_idx" ON "point_de_vente" ("vendor_id")`)
    console.log("OK: point_de_vente_vendor_id_idx")
  } catch (e: any) { console.log("WARN point_de_vente_vendor_id_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_is_active_idx" ON "point_de_vente" ("is_active")`)
    console.log("OK: point_de_vente_is_active_idx")
  } catch (e: any) { console.log("WARN point_de_vente_is_active_idx:", e.message) }

  // Create point_de_vente_bouteille table
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "point_de_vente_bouteille" (
        "id" text PRIMARY KEY NOT NULL,
        "point_de_vente_id" text NOT NULL REFERENCES "point_de_vente"("id") ON DELETE CASCADE,
        "brand_id" text NOT NULL REFERENCES "brand"("id") ON DELETE CASCADE,
        "format" text NOT NULL,
        "quantity" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `)
    console.log("OK: point_de_vente_bouteille table created")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille table:", e.message) }

  try {
    await sql.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "point_de_vente_bouteille_unique_idx" ON "point_de_vente_bouteille" ("point_de_vente_id", "brand_id", "format")`)
    console.log("OK: point_de_vente_bouteille_unique_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_unique_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_point_idx" ON "point_de_vente_bouteille" ("point_de_vente_id")`)
    console.log("OK: point_de_vente_bouteille_point_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_point_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_brand_idx" ON "point_de_vente_bouteille" ("brand_id")`)
    console.log("OK: point_de_vente_bouteille_brand_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_brand_idx:", e.message) }

  // Create vendor_onboarding table
  try {
    await sql.unsafe(`
      CREATE TABLE IF NOT EXISTS "vendor_onboarding" (
        "id" text PRIMARY KEY NOT NULL,
        "user_id" text NOT NULL UNIQUE REFERENCES "user"("id") ON DELETE CASCADE,
        "point_name" text NOT NULL,
        "district" text NOT NULL,
        "address" text NOT NULL,
        "phone" text,
        "brands" text[] DEFAULT '{}'::text[] NOT NULL,
        "inventory" jsonb DEFAULT '[]'::jsonb NOT NULL,
        "status" text DEFAULT 'draft' NOT NULL,
        "point_de_vente_id" text REFERENCES "point_de_vente"("id") ON DELETE SET NULL,
        "created_at" timestamp DEFAULT now() NOT NULL,
        "updated_at" timestamp DEFAULT now() NOT NULL
      )
    `)
    console.log("OK: vendor_onboarding table created")
  } catch (e: any) { console.log("WARN vendor_onboarding table:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_status_idx" ON "vendor_onboarding" ("status")`)
    console.log("OK: vendor_onboarding_status_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_status_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_point_id_idx" ON "vendor_onboarding" ("point_de_vente_id")`)
    console.log("OK: vendor_onboarding_point_id_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_point_id_idx:", e.message) }

  // point_de_vente service columns (in case table existed but columns missing)
  const serviceCols = [
    { name: "delivery_enabled", type: "boolean DEFAULT false NOT NULL" },
    { name: "delivery_fee", type: "integer DEFAULT 0 NOT NULL" },
    { name: "exchange_enabled", type: "boolean DEFAULT false NOT NULL" },
    { name: "exchange_brands", type: "text[] DEFAULT '{}'::text[] NOT NULL" },
    { name: "exchange_formats", type: "text[] DEFAULT '{}'::text[] NOT NULL" },
    { name: "gas_sale_enabled", type: "boolean DEFAULT false NOT NULL" }
  ]
  for (const col of serviceCols) {
    try {
      await sql.unsafe(`ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "${col.name}" ${col.type}`)
      console.log(`OK: point_de_vente.${col.name}`)
    } catch (e: any) { console.log(`WARN point_de_vente.${col.name}:`, e.message) }
  }

  // point_de_vente_bouteille columns
  try { await sql.unsafe(`ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 0 NOT NULL`); console.log("OK: point_de_vente_bouteille.quantity"); }
  catch (e: any) { console.log("WARN point_de_vente_bouteille.quantity:", e.message) }
  try { await sql.unsafe(`ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL`); console.log("OK: point_de_vente_bouteille.created_at"); }
  catch (e: any) { console.log("WARN point_de_vente_bouteille.created_at:", e.message) }
  try { await sql.unsafe(`ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL`); console.log("OK: point_de_vente_bouteille.updated_at"); }
  catch (e: any) { console.log("WARN point_de_vente_bouteille.updated_at:", e.message) }

  try {
    await sql.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "point_de_vente_bouteille_unique_idx" ON "point_de_vente_bouteille" ("point_de_vente_id", "brand_id", "format")`)
    console.log("OK: point_de_vente_bouteille_unique_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_unique_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_point_idx" ON "point_de_vente_bouteille" ("point_de_vente_id")`)
    console.log("OK: point_de_vente_bouteille_point_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_point_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_brand_idx" ON "point_de_vente_bouteille" ("brand_id")`)
    console.log("OK: point_de_vente_bouteille_brand_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_brand_idx:", e.message) }

  // vendor_onboarding table indexes
  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_status_idx" ON "vendor_onboarding" ("status")`)
    console.log("OK: vendor_onboarding_status_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_status_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_point_id_idx" ON "vendor_onboarding" ("point_de_vente_id")`)
    console.log("OK: vendor_onboarding_point_id_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_point_id_idx:", e.message) }

  // point_de_vente_bouteille indexes
  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_point_idx" ON "point_de_vente_bouteille" ("point_de_vente_id")`)
    console.log("OK: point_de_vente_bouteille_point_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_point_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_brand_idx" ON "point_de_vente_bouteille" ("brand_id")`)
    console.log("OK: point_de_vente_bouteille_brand_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_brand_idx:", e.message) }

  // vendor_onboarding indexes
  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_status_idx" ON "vendor_onboarding" ("status")`)
    console.log("OK: vendor_onboarding_status_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_status_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_point_id_idx" ON "vendor_onboarding" ("point_de_vente_id")`)
    console.log("OK: vendor_onboarding_point_id_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_point_id_idx:", e.message) }

  // point_de_vente indexes
  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_vendor_id_idx" ON "point_de_vente" ("vendor_id")`)
    console.log("OK: point_de_vente_vendor_id_idx")
  } catch (e: any) { console.log("WARN point_de_vente_vendor_id_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_is_active_idx" ON "point_de_vente" ("is_active")`)
    console.log("OK: point_de_vente_is_active_idx")
  } catch (e: any) { console.log("WARN point_de_vente_is_active_idx:", e.message) }

  // vendor_onboarding indexes
  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_status_idx" ON "vendor_onboarding" ("status")`)
    console.log("OK: vendor_onboarding_status_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_status_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_point_id_idx" ON "vendor_onboarding" ("point_de_vente_id")`)
    console.log("OK: vendor_onboarding_point_id_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_point_id_idx:", e.message) }

  // point_de_vente_bouteille indexes
  try {
    await sql.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "point_de_vente_bouteille_unique_idx" ON "point_de_vente_bouteille" ("point_de_vente_id", "brand_id", "format")`)
    console.log("OK: point_de_vente_bouteille_unique_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_unique_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_point_idx" ON "point_de_vente_bouteille" ("point_de_vente_id")`)
    console.log("OK: point_de_vente_bouteille_point_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_point_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_bouteille_brand_idx" ON "point_de_vente_bouteille" ("brand_id")`)
    console.log("OK: point_de_vente_bouteille_brand_idx")
  } catch (e: any) { console.log("WARN point_de_vente_bouteille_brand_idx:", e.message) }

  // vendor_onboarding indexes
  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_status_idx" ON "vendor_onboarding" ("status")`)
    console.log("OK: vendor_onboarding_status_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_status_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_point_id_idx" ON "vendor_onboarding" ("point_de_vente_id")`)
    console.log("OK: vendor_onboarding_point_id_idx")
  } catch (e: any) { console.log("WARN vendor_onboarding_point_id_idx:", e.message) }

  // point_de_vente indexes
  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_vendor_id_idx" ON "point_de_vente" ("vendor_id")`)
    console.log("OK: point_de_vente_vendor_id_idx")
  } catch (e: any) { console.log("WARN point_de_vente_vendor_id_idx:", e.message) }

  try {
    await sql.unsafe(`CREATE INDEX IF NOT EXISTS "point_de_vente_is_active_idx" ON "point_de_vente" ("is_active")`)
    console.log("OK: point_de_vente_is_active_idx")
  } catch (e: any) { console.log("WARN point_de_vente_is_active_idx:", e.message) }

  console.log("=== Missing tables creation complete ===")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e)
    process.exit(1)
  })