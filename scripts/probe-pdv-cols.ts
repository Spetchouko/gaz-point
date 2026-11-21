import "dotenv/config"
import { neon } from "@neondatabase/serverless"

/** Compare les colonnes réelles de point_de_vente (Neon) avec le schéma Drizzle. */
const DRIZZLE_COLUMNS = [
  "id",
  "name",
  "district",
  "address",
  "phone",
  "brands",
  "formats",
  "delivery_enabled",
  "delivery_fee",
  "exchange_enabled",
  "exchange_brands",
  "exchange_formats",
  "gas_sale_enabled",
  "vendor_id",
  "is_active",
  "created_at",
  "updated_at",
]

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL manquante")
  const sql = neon(url)

  const rows = await sql`
    select column_name, data_type, is_nullable, column_default
    from information_schema.columns
    where table_schema = 'public' and table_name = 'point_de_vente'
    order by ordinal_position
  `
  const actual = rows.map((r) => r.column_name as string)
  console.log("COLONNES NEON :", actual.join(", "))
  console.log(
    "MANQUANTES (schéma Drizzle absent de Neon) :",
    DRIZZLE_COLUMNS.filter((c) => !actual.includes(c)).join(", ") || "aucune"
  )
  console.log(
    "EN TROP (Neon hors schéma Drizzle) :",
    actual.filter((c) => !DRIZZLE_COLUMNS.includes(c)).join(", ") || "aucune"
  )

  // Tentative réelle de la requête utilisée par /api/depot/mine
  try {
    const { db } = await import("../db")
    const { pointDeVente } = await import("../db/schema")
    const { eq } = await import("drizzle-orm")
    const result = await db
      .select()
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, "probe-nonexistent"))
      .limit(1)
    console.log("REQUÊTE Drizzle OK (0 ligne attendue) :", result.length)
  } catch (error) {
    console.log(
      "REQUÊTE Drizzle EN ÉCHEC :",
      error instanceof Error ? error.message.slice(0, 500) : String(error)
    )
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e)
    process.exit(1)
  })
