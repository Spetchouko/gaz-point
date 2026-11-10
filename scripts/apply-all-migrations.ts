import "dotenv/config"
import { neon } from "@neondatabase/serverless"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) { console.log("DATABASE_URL missing"); process.exit(1) }
  const sql = neon(url)

  // 0016: traffic_event enrichment
  try { await sql.unsafe(`ALTER TABLE "traffic_event" ADD COLUMN IF NOT EXISTS "session_id" text;`); console.log("OK: traffic_event.session_id"); }
  catch (e: any) { console.log("WARN traffic_event.session_id:", e.message) }
  try { await sql.unsafe(`ALTER TABLE "traffic_event" ADD COLUMN IF NOT EXISTS "metadata" jsonb;`); console.log("OK: traffic_event.metadata"); }
  catch (e: any) { console.log("WARN traffic_event.metadata:", e.message) }

  // 0014: disponibilite services
  try { await sql.unsafe(`ALTER TABLE "disponibilite" ADD COLUMN IF NOT EXISTS "delivery" boolean DEFAULT false NOT NULL;`); console.log("OK: disponibilite.delivery"); }
  catch (e: any) { console.log("WARN disponibilite.delivery:", e.message) }
  try { await sql.unsafe(`ALTER TABLE "disponibilite" ADD COLUMN IF NOT EXISTS "exchange" boolean DEFAULT false NOT NULL;`); console.log("OK: disponibilite.exchange"); }
  catch (e: any) { console.log("WARN disponibilite.exchange:", e.message) }
  try { await sql.unsafe(`ALTER TABLE "disponibilite" ADD COLUMN IF NOT EXISTS "gas_sale" boolean DEFAULT false NOT NULL;`); console.log("OK: disponibilite.gas_sale"); }
  catch (e: any) { console.log("WARN disponibilite.gas_sale:", e.message) }

  // 0017: vendor_onboarding + point_de_vente_bouteille
  try { await sql.unsafe(`CREATE TABLE IF NOT EXISTS "vendor_onboarding" (
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
  )`); console.log("OK: vendor_onboarding table"); }
  catch (e: any) { console.log("WARN vendor_onboarding table:", e.message) }

  try { await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_status_idx" ON "vendor_onboarding" ("status");`); console.log("OK: vendor_onboarding_status_idx"); }
  catch (e: any) { console.log("WARN vendor_onboarding_status_idx:", e.message) }

  try { await sql.unsafe(`CREATE INDEX IF NOT EXISTS "vendor_onboarding_point_id_idx" ON "vendor_onboarding" ("point_de_vente_id");`); console.log("OK: vendor_onboarding_point_id_idx"); }
  catch (e: any) { console.log("WARN vendor_onboarding_point_id_idx:", e.message) }

  try { await sql.unsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "point_de_vente_bouteille_unique_idx" ON "point_de_vente_bouteille" ("point_de_vente_id", "brand_id", "format");`); console.log("OK: point_de_vente_unique_idx"); }
  catch (e: any) { console.log("WARN point_de_vente_unique_idx:", e.message) }

  // point_de_vente service columns
  const serviceCols = ["delivery_enabled","delivery_fee","exchange_enabled","exchange_brands","exchange_formats","gas_sale_enabled"]
  for (const col of serviceCols) {
    try { await sql.unsafe(`ALTER TABLE "point_de_vente" ADD COLUMN IF NOT EXISTS "${col}" ${col === "delivery_fee" || col === "delivery_enabled" || col === "gas_sale_enabled" ? "boolean" : "text"} DEFAULT false NOT NULL;`); console.log(`OK: point_de_vente.${col}`); }
    catch (e: any) { console.log(`WARN point_de_vente.${col}:`, e.message) }
  }

  // point_de_vente_bouteille columns
  try { await sql.unsafe(`ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "quantity" integer DEFAULT 0 NOT NULL;`); console.log("OK: point_de_vente_bouteille.quantity"); }
  catch (e: any) { console.log("WARN point_de_vente_bouteille.quantity:", e.message) }
  try { await sql.unsafe(`ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "created_at" timestamp DEFAULT now() NOT NULL;`); console.log("OK: point_de_vente_bouteille.created_at"); }
  catch (e: any) { console.log("WARN point_de_vente_bouteille.created_at:", e.message) }
  try { await sql.unsafe(`ALTER TABLE "point_de_vente_bouteille" ADD COLUMN IF NOT EXISTS "updated_at" timestamp DEFAULT now() NOT NULL;`); console.log("OK: point_de_vente_bouteille.updated_at"); }
  catch (e: any) { console.log("WARN point_de_vente_bouteille.updated_at:", e.message) }

  console.log("=== Migrations completes ===")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e)
    process.exit(1)
  })