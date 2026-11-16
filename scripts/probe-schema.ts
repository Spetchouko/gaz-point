import "dotenv/config"
import { neon } from "@neondatabase/serverless"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log("DATABASE_URL missing")
    return
  }
  const sql = neon(url)

  const tables = await sql`
    select table_name from information_schema.tables
    where table_schema = 'public'
      and table_name in ('traffic_event', 'vendor_onboarding', 'point_de_vente_bouteille', 'point_de_vente', 'disponibilite', 'user', 'session', 'verification', 'account')
    order by table_name
  `
  console.log("TABLES:", JSON.stringify(tables))

  const teCols = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'traffic_event'
    order by ordinal_position
  `
  console.log("traffic_event cols:", JSON.stringify(teCols.map((c) => c.column_name)))

  const pdbCols = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'point_de_vente_bouteille'
    order by ordinal_position
  `
  console.log("point_de_vente_bouteille cols:", JSON.stringify(pdbCols.map((c) => c.column_name)))

  const pdvCols = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'point_de_vente'
      and column_name in ('delivery_enabled','delivery_fee','exchange_enabled','exchange_brands','exchange_formats','gas_sale_enabled')
  `
  console.log("point_de_vente service cols:", JSON.stringify(pdvCols.map((c) => c.column_name)))

  const dispoCols = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'disponibilite'
      and column_name in ('delivery','exchange','gas_sale')
  `
  console.log("disponibilite service cols:", JSON.stringify(dispoCols.map((c) => c.column_name)))

  const mig = await sql`
    select * from drizzle.__drizzle_migrations order by created_at desc limit 5
  `.catch((e) => {
    console.log("drizzle migrations table not accessible:", (e as Error).message)
    return []
  })
  console.log("MIGRATIONS:", JSON.stringify(mig))
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e)
    process.exit(1)
  })
