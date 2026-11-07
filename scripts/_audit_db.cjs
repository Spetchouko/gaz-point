require("dotenv").config()
const { neon } = require("@neondatabase/serverless")
const sql = neon(process.env.DATABASE_URL)

function mask(email) {
  if (!email) return email
  const [name, domain] = email.split("@")
  return `${name.slice(0, 2)}***@${domain}`
}

;(async () => {
  const roles = await sql`select role, count(*)::int as n from "user" group by role order by role`
  console.log("roles", roles)
  for (const t of [
    "user",
    "pointDeVente",
    "disponibilite",
    "adminAction",
    "collaborateurPermission",
    "session",
    "account",
    "avis",
    "publicite",
  ]) {
    try {
      const r = await sql.query(`select count(*)::int as n from "${t}"`)
      console.log(t, r[0].n)
    } catch (e) {
      console.log(t, "ERR", e.message)
    }
  }
  try {
    const d = await sql`select status, count(*)::int as n, coalesce(sum(quantity),0)::int as qty from disponibilite group by status`
    console.log("dispo", d)
  } catch (e) {
    console.log("dispo ERR", e.message)
  }
  const staff = await sql`select id, email, role, "emailVerified", "isActive" from "user" where role in ('admin','collaborateur') order by role`
  console.log(
    "staff",
    staff.map((a) => ({ ...a, email: mask(a.email) }))
  )
})().catch((e) => {
  console.error("FATAL", e.message)
  process.exit(1)
})
