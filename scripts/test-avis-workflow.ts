import { neon } from "@neondatabase/serverless"

const BASE = process.env.AVIS_TEST_BASE_URL ?? "http://127.0.0.1:3000"
const suffix = Date.now().toString(36)
const password = "TestAvis!2026"

const emails = {
  client: `test-avis-client-${suffix}@example.com`,
  vendor: `test-avis-vendor-${suffix}@example.com`,
  admin: `test-avis-admin-${suffix}@example.com`,
}

const userIds: string[] = []
const createdAvisIds: string[] = []
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
    headers: { Accept: "application/json", Origin: BASE, ...(init.headers ?? {}) },
  })
  const data = await response.json().catch(() => ({}))
  return { response, data }
}

async function signup(name: string, email: string) {
  const { response, data } = await api("/api/auth/sign-up/email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password }),
  })
  if (!response.ok) throw new Error(`signup ${email}: ${JSON.stringify(data)}`)
  const id = data.user?.id ?? data.id
  if (!id) throw new Error(`signup sans id: ${JSON.stringify(data)}`)
  userIds.push(id)
  return id
}

async function signin(email: string) {
  const response = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  })
  if (!response.ok) throw new Error(`signin ${email}: ${response.status}`)
  const cookies = response.headers.getSetCookie().map((value) => value.split(";")[0])
  return cookies.join("; ")
}

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("DATABASE_URL manquante")
  const sql = neon(url)

  console.log("Création des comptes de test")
  await signup("Avis Client Test", emails.client)
  const vendorId = await signup("Avis Vendeur Test", emails.vendor)
  const adminId = await signup("Avis Admin Test", emails.admin)

  await sql.query(
    `update "user" set email_verified = true where id = any($1::text[])`,
    [userIds]
  )
  await sql.query(`update "user" set role = 'vendor' where id = $1`, [vendorId])
  await sql.query(`update "user" set role = 'admin' where id = $1`, [adminId])

  const clientCookie = await signin(emails.client)
  const vendorCookie = await signin(emails.vendor)
  const adminCookie = await signin(emails.admin)

  const asClient = { Cookie: clientCookie }
  const asVendor = { Cookie: vendorCookie }
  const asAdmin = { Cookie: adminCookie }
  const jsonHeaders = { "Content-Type": "application/json" }

  console.log("\nSoumission client")
  let result = await api("/api/avis", {
    method: "POST",
    headers: { ...jsonHeaders, ...asClient },
    body: JSON.stringify({ rating: 5, quote: "Service client au top, merci GazPoints." }),
  })
  check("client peut soumettre", result.response.status === 201, JSON.stringify(result.data))
  const clientAvisId = result.data.avis?.id
  if (clientAvisId) createdAvisIds.push(clientAvisId)

  result = await api("/api/avis", { headers: asClient })
  check("client lit son avis", result.response.status === 200 && result.data.avis?.status === "pending")
  check("note enregistrée", result.data.avis?.rating === 5)

  result = await api("/api/avis", {
    method: "POST",
    headers: { ...jsonHeaders, ...asClient },
    body: JSON.stringify({ rating: 4, quote: "Un deuxième avis ne doit pas être accepté." }),
  })
  check("doublon refusé", result.response.status === 409)

  result = await api("/api/avis", {
    method: "POST",
    headers: { ...jsonHeaders, ...jsonHeaders, ...asVendor },
    body: JSON.stringify({ rating: 4, quote: "Plateforme efficace pour mon dépôt de gaz." }),
  })
  check("vendeur peut soumettre", result.response.status === 201, JSON.stringify(result.data))
  const vendorAvisId = result.data.avis?.id
  if (vendorAvisId) createdAvisIds.push(vendorAvisId)

  console.log("\nPermissions")
  if (clientAvisId) {
    result = await api(`/api/avis/${clientAvisId}`, {
      method: "PATCH",
      headers: { ...jsonHeaders, ...asVendor },
      body: JSON.stringify({ rating: 1, quote: "Tentative de modification d'un avis d'autrui." }),
    })
    check("vendeur ne peut pas modifier l'avis du client", result.response.status === 403)
  }

  if (clientAvisId) {
    result = await api(`/api/avis/${clientAvisId}`, {
      method: "PATCH",
      headers: { ...jsonHeaders, ...asClient },
      body: JSON.stringify({ rating: 4, quote: "Avis client modifié avant validation." }),
    })
    check("client peut modifier son avis en attente", result.response.status === 200)
  }

  console.log("\nModération administrateur")
  result = await api("/api/admin/avis?status=pending&role=client", { headers: asAdmin })
  check(
    "admin filtre par statut et rôle",
    result.response.status === 200 &&
      Array.isArray(result.data.avis) &&
      result.data.avis.some((a: { id: string }) => a.id === clientAvisId)
  )

  if (clientAvisId) {
    result = await api(`/api/admin/avis/${clientAvisId}`, {
      method: "PATCH",
      headers: { ...jsonHeaders, ...asAdmin },
      body: JSON.stringify({ action: "approve" }),
    })
    check("admin valide l'avis", result.response.status === 200 && result.data.avis?.status === "approved")
  }

  result = await api("/api/avis/public")
  check(
    "avis validé publié",
    result.response.status === 200 &&
      Array.isArray(result.data.avis) &&
      result.data.avis.some((a: { quote: string }) => a.quote === "Avis client modifié avant validation.")
  )

  console.log("\nProtection des avis publiés")
  if (clientAvisId) {
    result = await api(`/api/avis/${clientAvisId}`, {
      method: "PATCH",
      headers: { ...jsonHeaders, ...asClient },
      body: JSON.stringify({ rating: 1, quote: "Tentative de modification après publication." }),
    })
    check("avis publié non modifiable par l'auteur", result.response.status === 403)

    result = await api(`/api/avis/${clientAvisId}`, { method: "DELETE", headers: asClient })
    check("avis publié non supprimable par l'auteur", result.response.status === 403)
  }

  if (vendorAvisId) {
    result = await api(`/api/admin/avis/${vendorAvisId}`, {
      method: "DELETE",
      headers: asAdmin,
    })
    check("admin supprime un avis", result.response.status === 200)
  }

  result = await api("/api/avis", {
    method: "POST",
    headers: { ...jsonHeaders, ...asVendor },
    body: JSON.stringify({ rating: 3, quote: "Nouvel avis vendeur après suppression." }),
  })
  check("vendeur peut soumettre à nouveau", result.response.status === 201)
  if (result.data.avis?.id) createdAvisIds.push(result.data.avis.id)
}

async function cleanup() {
  const url = process.env.DATABASE_URL
  if (!url) return
  const sql = neon(url)
  try {
    if (createdAvisIds.length > 0) {
      await sql.query(`delete from "avis" where id = any($1::text[])`, [createdAvisIds])
    }
    if (userIds.length > 0) {
      await sql.query(`delete from "user" where id = any($1::text[])`, [userIds])
    }
    // Filet de sécurité : supprime uniquement les comptes générés par ce script.
    await sql.query(`delete from "user" where email like 'test-avis-%@example.com'`)
    console.log("\nNettoyage terminé")
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
