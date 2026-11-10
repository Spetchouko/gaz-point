import { neon } from "@neondatabase/serverless"

const sql = neon as unknown as Record<string, unknown>
console.log("keys of neon():", Object.keys(neon(process.env.DATABASE_URL as string)))
process.exit(0)
