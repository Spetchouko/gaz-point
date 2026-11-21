import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const BASE = process.env.DEPOT_TEST_BASE_URL ?? "http://127.0.0.1:3000"
const suffix = Date.now().toString(36)
const password = "TestDepot!2026"
const email = `test-depotmine-${suffix}@example.com`
const userIds: string[] = []

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL manquante")
  const sql = neon(url)

  const signupRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: "Depot Mine Test", email, password }),
  })
  const signupBody = await signupRes.json().catch(() => ({}))
  if (!signupRes.ok) throw new Error(`signup: ${signupRes.status} ${JSON.stringify(signupBody)}`)
  const id = signupBody.user?.id ?? signupBody.id
  userIds.push(id)

  await sql.query(`update "user" set email_verified = true, role = 'vendor' where id = $1`, [id])

  const signinRes = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  })
  if (!signinRes.ok) throw new Error(`signin: ${signinRes.status}`)
  const cookie = signinRes.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ")

  for (const path of ["/api/depot/mine", "/api/user/me"]) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Cookie: cookie, Accept: "application/json" },
    })
    const body = await res.text()
    console.log(`${path} -> ${res.status} ${body.slice(0, 600)}`)
  }

  // page HTML avec session
  for (const path of ["/dashboard/vendeur", "/dashboard/depot"]) {
    const res = await fetch(`${BASE}${path}`, {
      headers: { Cookie: cookie, Accept: "text/html" },
      redirect: "manual",
    })
    const body = await res.text()
    const loc = res.headers.get("location") ?? ""
    const title = body.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ""
    console.log(
      `${path} -> ${res.status}${loc ? ` location=${loc}` : ""}${title ? ` title="${title}"` : ""}`
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
