import { neon } from "@neondatabase/serverless"

async function main() {
  const sql = neon(process.env.DATABASE_URL as string)

  // Use .unsafe() for raw DDL (no parameterization)
  const statements = [
    `ALTER TABLE "traffic_event" ADD COLUMN IF NOT EXISTS "session_id" text;`,
    `ALTER TABLE "traffic_event" ADD COLUMN IF NOT EXISTS "metadata" jsonb;`,
    `CREATE INDEX IF NOT EXISTS "traffic_event_session_id_idx" ON "traffic_event" ("session_id");`,
    `CREATE INDEX IF NOT EXISTS "traffic_event_event_type_created_idx" ON "traffic_event" ("event_type", "created_at");`,
  ]

  for (const stmt of statements) {
    try {
      await sql.unsafe(stmt)
      console.log(`OK: ${stmt}`)
    } catch (e) {
      console.log(`WARN: ${stmt} -> ${(e as Error).message}`)
    }
  }

  // Verify
  const cols = await sql`
    select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'traffic_event'
    and column_name in ('session_id', 'metadata')
  `
  console.log("VERIFIED:", JSON.stringify(cols))
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e)
    process.exit(1)
  })