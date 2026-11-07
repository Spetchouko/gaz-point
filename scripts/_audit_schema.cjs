require("dotenv").config()
const { neon } = require("@neondatabase/serverless")
const sql = neon(process.env.DATABASE_URL)

;(async () => {
  const tables = await sql`select table_name from information_schema.tables where table_schema = 'public' order by table_name`
  console.log("tables", tables.map((t) => t.table_name))
  for (const t of tables.map((t) => t.table_name)) {
    const cols = await sql`select column_name, data_type from information_schema.columns where table_schema='public' and table_name=${t} order by ordinal_position`
    console.log(`\n[${t}]`, cols.map((c) => `${c.column_name}:${c.data_type}`).join(", "))
  }
})().catch((e) => {
  console.error("FATAL", e.message)
  process.exit(1)
})
