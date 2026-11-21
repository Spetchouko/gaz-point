/**
 * Vérification finale (léger) : un seul compte vendeur pour respecter le
 * rate limit local (10 sign-up/sign-in par heure).
 *
 *  - /api/recherche et /api/disponibilite/mine après suppression des colonnes GPS
 *  - /api/depot/mine sans champ debug
 *  - pages dashboard vendeur + rechargements
 *  - session stable sur 15 requêtes
 * (Les restrictions de rôle client/vendeur sont couvertes par scripts/test-depot-nav.ts)
 */
import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const BASE = process.env.DEPOT_TEST_BASE_URL ?? "http://127.0.0.1:3000"
const suffix = Date.now().toString(36)
const password = "TestDepot!2026"
const email = `test-final-${suffix}@example.com`
const userIds: string[] = []
const failures: string[] = []

function check(name: string, ok: boolean, detail = "") {
  if (ok) console.log(`  PASS ${name}`)
  else {
    failures.push(name)
    console.log(`  FAIL ${name} ${detail}`)
  }
}

async function get(path: string, headers: Record<string, string>) {
  const response = await fetch(`${BASE}${path}`, {
    redirect: "manual",
    headers: { Accept: "text/html,application/json", Origin: BASE, ...headers },
  })
  const text = await response.text().catch(() => "")
  return { response, text }
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL manquante")
  const sql = neon(url)

  const signupRes = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ name: "Final Vendor Test", email, password }),
  })
  const signupBody = await signupRes.json().catch(() => ({}))
  if (!signupRes.ok) {
    throw new Error(`signup ${signupRes.status} ${JSON.stringify(signupBody)}`)
  }
  const id = signupBody.user?.id ?? signupBody.id
  userIds.push(id)
  await sql.query(`update "user" set email_verified = true, role = 'vendor' where id = $1`, [id])

  const signinRes = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  })
  if (!signinRes.ok) throw new Error(`signin ${signinRes.status}`)
  const cookie = signinRes.headers
    .getSetCookie()
    .map((v) => v.split(";")[0])
    .join("; ")
  const asVendor = { Cookie: cookie }

  console.log("\n1. Session vendeur stable (15 requêtes consécutives)")
  let okCount = 0
  for (let i = 0; i < 15; i++) {
    const { response } = await get("/api/user/me", { ...asVendor, Accept: "application/json" })
    if (response.status === 200) okCount++
  }
  check("15/15 requêtes de session à 200", okCount === 15, `obtenu ${okCount}/15`)

  console.log("\n2. Pages du dashboard vendeur")
  for (const path of [
    "/dashboard/vendeur",
    "/dashboard/depot",
    "/dashboard/depot/disponibilites",
    "/dashboard/depot/services",
    "/dashboard/depot/reservations",
  ]) {
    const { response } = await get(path, asVendor)
    check(`${path} → 200`, response.status === 200, `status=${response.status}`)
  }

  console.log("\n3. Rafraîchissement de /dashboard/depot (3 fois)")
  let refreshOk = 0
  for (let i = 0; i < 3; i++) {
    const { response } = await get("/dashboard/depot", asVendor)
    if (response.status === 200 && !response.headers.get("location")) refreshOk++
  }
  check("3 rechargements à 200 sans redirection", refreshOk === 3, `${refreshOk}/3`)

  console.log("\n4. APIs pointant vers point_de_vente (colonnes GPS non migrées)")
  {
    const { response, text } = await get("/api/recherche?zone=Douala&history=0", {
      ...asVendor,
      Accept: "application/json",
    })
    check("GET /api/recherche → 200", response.status === 200, `status=${response.status} ${text.slice(0, 200)}`)
    if (response.status === 200) {
      let payload: { results?: unknown; count?: unknown } = {}
      try {
        payload = JSON.parse(text)
      } catch {
        payload = {}
      }
      check(
        "réponse de recherche bien formée",
        Array.isArray(payload.results) && typeof payload.count === "number",
        text.slice(0, 160)
      )
      const results = (payload.results ?? []) as Array<{ distanceKm?: number | null }>
      check(
        "aucune distance inventée (distanceKm null)",
        results.every((r) => r.distanceKm == null),
        JSON.stringify(results.slice(0, 3).map((r) => r.distanceKm))
      )
    }
  }
  {
    const { response, text } = await get("/api/disponibilite/mine", {
      ...asVendor,
      Accept: "application/json",
    })
    check("GET /api/disponibilite/mine → 200", response.status === 200, `status=${response.status} ${text.slice(0, 200)}`)
  }
  {
    const { response, text } = await get("/api/depot/mine", {
      ...asVendor,
      Accept: "application/json",
    })
    check("GET /api/depot/mine → 200", response.status === 200, `status=${response.status} ${text.slice(0, 200)}`)
    check("pas de champ debug dans la réponse", !text.includes('"debug"'), text.slice(0, 160))
  }
}

async function cleanup() {
  const url = process.env.DATABASE_URL
  if (!url) return
  const sql = neon(url)
  try {
    if (userIds.length) {
      await sql.query(`delete from "user" where id = any($1::text[])`, [userIds])
    }
    await sql.query(`delete from "user" where email like 'test-final-%@example.com'`)
    console.log("\nNettoyage terminé (compte de test supprimé)")
  } catch (error) {
    console.error("Nettoyage partiel:", (error as Error).message)
  }
}

main()
  .catch((error) => {
    failures.push("workflow")
    console.error("ERREUR:", (error as Error).message)
  })
  .finally(async () => {
    await cleanup()
    console.log(`\n${failures.length === 0 ? "SUCCÈS" : "ÉCHEC"} — ${failures.length} échec(s)`)
    process.exit(failures.length === 0 ? 0 : 1)
  })
