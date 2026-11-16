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
    const statements = content
      .split(/;\s*\n/)
      .map((statement) => statement.replace(/--[^\n]*\n/g, "").trim())
      .filter(Boolean)

    for (const statement of statements) {
      try {
        // Chaque instruction est idempotente (ADD COLUMN IF NOT EXISTS /
        // CREATE TABLE IF NOT EXISTS). Une erreur interrompt le runner afin
        // qu'un déploiement ne soit jamais considéré comme réussi à tort.
        await sql.query(statement)
      } catch (error) {
        throw new Error(
          `${file}: ${(error as Error).message}\nStatement: ${statement.slice(0, 120)}`
        )
      }
    }
    console.log(`  OK: ${file} appliquee (${statements.length} instructions)`)
  }
  console.log("=== Done ===")
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e)
    process.exit(1)
  })
