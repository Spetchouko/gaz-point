/**
 * Test de navigation du dashboard vendeur : « Mes points de vente ».
 *
 * Crée temporairement un compte vendeur + un compte client, ouvre une session
 * réelle via Better Auth, puis observe les réponses HTTP des routes
 * /dashboard/depot* et /dashboard/vendeur. Les comptes de test sont supprimés
 * à la fin (nettoyage garanti dans `finally`).
 *
 * Usage : tsx scripts/test-depot-nav.ts
 */
import "dotenv/config"
import { neon } from "@neondatabase/serverless"

const BASE = process.env.DEPOT_TEST_BASE_URL ?? "http://127.0.0.1:3000"
const suffix = Date.now().toString(36)
const password = "TestDepot!2026"

const emails = {
  vendor: `test-depotnav-vendor-${suffix}@example.com`,
  client: `test-depotnav-client-${suffix}@example.com`,
}

const userIds: string[] = []
const failures: string[] = []

function check(name: string, ok: boolean, detail = "") {
  if (ok) {
    console.log(`  PASS ${name}`)
  } else {
    failures.push(name)
    console.log(`  FAIL ${name} ${detail}`)
  }
}

async function api(path: string, init: RequestInit = {}) {
  const response = await fetch(`${BASE}${path}`, {
    ...init,
    redirect: "manual",
    headers: {
      Accept: "text/html,application/json",
      Origin: BASE,
      ...(init.headers ?? {}),
    },
  })
  const text = await response.text().catch(() => "")
  return { response, text }
}

async function signup(name: string, email: string) {
  const { response, text } = await api("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })
  const data = JSON.parse(text || "{}")
  if (!response.ok) throw new Error(`signup ${email}: ${response.status} ${text}`)
  const id = data.user?.id ?? data.id
  if (!id) throw new Error(`signup sans id: ${text}`)
  userIds.push(id)
  return id
}

async function signin(email: string) {
  const response = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Origin: BASE,
    },
    body: JSON.stringify({ email, password }),
    redirect: "manual",
  })
  if (!response.ok) throw new Error(`signin ${email}: ${response.status}`)
  const cookies = response.headers
    .getSetCookie()
    .map((value) => value.split(";")[0])
  return cookies.join("; ")
}

/** Décrive une réponse de page : status + éventuelle redirection. */
function describe(response: Response, text: string) {
  const location = response.headers.get("location") ?? ""
  if (location) return `status=${response.status} → ${location}`
  const title = text.match(/<title>([^<]*)<\/title>/i)?.[1] ?? ""
  return `status=${response.status}${title ? ` title="${title}"` : ""}`
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL manquante")
  const sql = neon(url)

  console.log("Création des comptes de test")
  const vendorId = await signup("Depot Nav Vendor Test", emails.vendor)
  await signup("Depot Nav Client Test", emails.client)
  await sql.query(
    `update "user" set email_verified = true, role = 'vendor' where id = $1`,
    [vendorId]
  )
  await sql.query(
    `update "user" set email_verified = true, role = 'client' where email = $1`,
    [emails.client]
  )

  const vendorCookie = await signin(emails.vendor)
  const clientCookie = await signin(emails.client)
  const asVendor = { Cookie: vendorCookie }
  const asClient = { Cookie: clientCookie }

  console.log("\n1. Session vendeur : /api/user/me")
  {
    const { response, text } = await api("/api/user/me", {
      headers: asVendor,
      redirect: "manual",
    })
    check(
      "session vendeur valide",
      response.status === 200,
      `status=${response.status} ${text.slice(0, 200)}`
    )
  }

  console.log("\n2. Navigation vendeur")
  for (const path of [
    "/dashboard/vendeur",
    "/dashboard/depot",
    "/dashboard/depot/disponibilites",
    "/dashboard/depot/services",
    "/dashboard/depot/reservations",
  ]) {
    const { response, text } = await api(path, { headers: asVendor })
    const info = describe(response, text)
    const ok = response.status === 200 && !response.headers.get("location")
    check(`${path} accessible`, ok, info)
    if (!ok) console.log(`       détail: ${info}`)
  }

  console.log("\n3. Rechargement direct de /dashboard/depot")
  {
    const first = await api("/dashboard/depot", { headers: asVendor })
    const again = await api("/dashboard/depot", { headers: asVendor })
    check(
      "rechargements successifs OK",
      first.response.status === 200 && again.response.status === 200,
      `${describe(first.response, first.text)} | ${describe(again.response, again.text)}`
    )
  }

  console.log("\n4. Restrictions de rôles")
  {
    const { response } = await api("/dashboard/depot", { headers: asClient })
    const location = response.headers.get("location") ?? ""
    check(
      "client redirigé hors /dashboard/depot",
      location.includes("/dashboard/client") || location.includes("/connexion"),
      `status=${response.status} → ${location}`
    )
  }
  {
    const { response } = await api("/dashboard/admin", { headers: asVendor })
    const location = response.headers.get("location") ?? ""
    check(
      "vendeur redirigé hors /dashboard/admin",
      location.length > 0,
      `status=${response.status} → ${location}`
    )
  }

  console.log("\n5. API de création de dépôt (rôle vendeur)")
  {
    const { response, text } = await api("/api/depot/mine", {
      headers: { ...asVendor, Accept: "application/json" },
    })
    check(
      "GET /api/depot/mine joignable",
      response.status === 200 || response.status === 404,
      `status=${response.status} ${text.slice(0, 200)}`
    )
  }
}

async function cleanup() {
  const url = process.env.DATABASE_URL
  if (!url) return
  const sql = neon(url)
  try {
    if (userIds.length > 0) {
      await sql.query(`delete from "user" where id = any($1::text[])`, [userIds])
    }
    await sql.query(
      `delete from "user" where email like 'test-depotnav-%@example.com'`
    )
    console.log("\nNettoyage terminé (comptes de test supprimés)")
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
    console.log(
      `\n${failures.length === 0 ? "SUCCÈS" : "ÉCHEC"} — ${failures.length} échec(s)`
    )
    process.exit(failures.length === 0 ? 0 : 1)
  })
