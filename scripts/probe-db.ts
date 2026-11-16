import "dotenv/config"
import { neon } from "@neondatabase/serverless"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) {
    console.log("DATABASE_URL missing")
    return
  }
  const parsed = new URL(url)
  console.log(
    "protocol:",
    parsed.protocol,
    "port:",
    parsed.port || "(default)",
    "hasCredentials:",
    !!(parsed.username && parsed.password)
  )

  const sql = neon(url)

  for (let i = 0; i < 3; i++) {
    try {
      const rows = await sql`select count(*)::int as n from "user"`
      console.log(`attempt ${i}: ok`, JSON.stringify(rows))
    } catch (e) {
      const err = e as Error & { cause?: unknown }
      console.log(`attempt ${i}: FAIL`, err.message)
      const c = err.cause as
        | { errors?: unknown[]; code?: string; message?: string }
        | undefined
      if (c) {
        console.log("  cause code:", c.code, "message:", c.message)
        if (Array.isArray(c.errors)) {
          for (const sub of c.errors) {
            const s = sub as { code?: string; message?: string; errno?: number }
            console.log("   sub:", s.code, s.message, s.errno)
          }
        }
      }
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error("FATAL", e)
    process.exit(1)
  })
