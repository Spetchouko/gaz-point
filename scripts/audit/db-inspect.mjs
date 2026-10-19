import fs from "node:fs"
import { neon } from "@neondatabase/serverless"

const env = fs.readFileSync(new URL("../../.env", import.meta.url), "utf8")
const m = env.match(/^DATABASE_URL=(.*)$/m)
const url = m[1].trim().replace(/^["']|["']$/g, "")
const sql = neon(url)

const queries = {
  roles: `select role, count(*)::int as c from "user" group by role order by role`,
  users: `select id, name, email, role, email_verified, is_active from "user" order by created_at desc limit 20`,
  points: `select count(*)::int as c from point_de_vente`,
  dispos: `select count(*)::int as c from disponibilite`,
  reservations: `select status, count(*)::int as c from reservation group by status`,
  avis: `select status, count(*)::int as c from avis group by status`,
  pubs: `select id, title, slot, status, start_at, end_at from publicite`,
  tables: `select table_name from information_schema.tables where table_schema='public' order by table_name`,
}

for (const [name, q] of Object.entries(queries)) {
  try {
    const r = await sql.query(q)
    console.log(`--- ${name}`)
    console.log(JSON.stringify(Array.isArray(r) ? r : r.rows, null, 1))
  } catch (e) {
    console.log(`--- ${name} ERROR: ${e.message}`)
  }
}
