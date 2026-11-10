import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { readFileSync } from "node:fs"
import { join } from "node:path"

const migrationFiles = ["0014_add_services_to_disponibilite.sql", "0016_analytics_events_enrich.sql", "0017_vendor_onboarding.sql"]

function loadFile(file: string): string {
  return readFileSync(join("drizzle", file), "utf8")
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log("DATABASE_URL missing")
    process.exit(1)
  }
  const sql = neon(url)

  for (const file of migrationFiles) {
    console.log(`=== Applying ${file} ===`)
    const content = loadFile(file)
    try {
      // Toute la migration est passée comme texte SQL brut (pas d'interpolation).
      // Les instructions sont idempotentes (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT EXISTS).
      await sql`${content}`
      console.log(`  OK: ${file} appliquee`)
    } catch (e) {
      console.log(`  WARN: ${file} -> ${(e as Error).message}`)
    }
  }
  console.log("=== Done ===")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e)
    process.exit(1)
  })
