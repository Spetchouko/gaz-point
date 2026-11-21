import "dotenv/config"
import { neon } from "@neondatabase/serverless"
import { execSync } from "node:child_process"

const BASE = process.env.DEPOT_TEST_BASE_URL ?? "http://127.0.0.1:3000"
const LOG = "/home/solomon/gaz-point/.next/dev/logs/next-development.log"
const suffix = Date.now().toString(36)
const password = "TestDepot!2026"
const email = `test-rerender-${suffix}@example.com`
const userIds: string[] = []

function rerenderCount(): number {
  try {
    const out = execSync(`grep -c "Too many re-renders" "${LOG}" || true`, {
      encoding: "utf8",
    })
    return Number(out.trim()) || 0
  } catch {
    return -1
  }
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL manquante")
  const sql = neon(url)

  const signupRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: "ReRender Test", email, password }),
  })
  const body = await signupRes.json().catch(() => ({}))
  if (!signupRes.ok) throw new Error(`signup ${signupRes.status} ${JSON.stringify(body)}`)
  const id = body.user?.id ?? body.id
  userIds.push(id)
  await sql.query(`update "user" set email_verified = true, role = 'vendor' where id = $1`, [id])

  const signinRes = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  })
  if (!signinRes.ok) throw new Error(`signin ${signinRes.status}`)
  const cookie = signinRes.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ")

  const pages = [
    "/dashboard/vendeur",
    "/dashboard/depot",
    "/dashboard/depot/disponibilites",
    "/dashboard/depot/services",
    "/dashboard/depot/reservations",
    "/dashboard/avis",
    "/dashboard/vendeur/profil",
    "/dashboard/parametres",
    "/dashboard/notifications",
  ]

  for (const page of pages) {
    const before = rerenderCount()
    const res = await fetch(`${BASE}${page}`, {
      headers: { Cookie: cookie, Accept: "text/html" },
      redirect: "manual",
    })
    await res.text()
    // Laisse le temps au serveur dev d'écrire dans le log.
    execSync("sleep 1")
    const after = rerenderCount()
    const delta = after - before
    console.log(
      `${delta > 0 ? "RE-RENDER" : "ok      "} ${page} status=${res.status} delta=${delta}`
    )
  }
}

main()
  .catch((e) => console.error("ERREUR", e))
  .finally(async () => {
    const url = process.env.DATABASE_URL
    if (url && userIds.length) {
      const sql = neon(url)
      await sql
        .query(`delete from "user" where id = any($1::text[])`, [userIds])
        .catch((e) => console.error("cleanup", e.message))
      console.log("cleanup ok")
    }
    process.exit(0)
  })
