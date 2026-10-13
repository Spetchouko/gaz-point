import { randomUUID } from "node:crypto"
import fs from "node:fs"
import fsp from "node:fs/promises"
import path from "node:path"
import * as lib from "./lib.mjs"
export { lib }

// En production (next start), l'id valide d'une action est celui du manifest
// par-route (worker), pas celui du manifest global. On préfère donc les
// manifests par-route (sous app/) au global, en s'en servant de repli.
async function loadRouteActionIds() {
  const server = path.join(lib.ROOT, ".next", "server")
  const files = []
  async function walk(dir) {
    for (const e of await fsp.readdir(dir, { withFileTypes: true })) {
      const p = path.join(dir, e.name)
      if (e.isDirectory()) await walk(p)
      else if (e.name === "server-reference-manifest.json") files.push(p)
    }
  }
  await walk(server)
  const byExport = {}
  const globalFile = path.join(server, "server-reference-manifest.json")
  const ordered = files.filter((f) => f === globalFile).concat(files.filter((f) => f !== globalFile))
  for (const file of ordered) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"))
    for (const [id, entry] of Object.entries(raw.node || {})) {
      if (entry && entry.exportedName) byExport[entry.exportedName] = id
    }
  }
  return byExport
}

const ids = await loadRouteActionIds()
const { BASE, db, dbOne, signIn, getPage, callAction, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD } = lib

const results = []
function record(name, ok, detail = "") {
  results.push({ name, ok, detail })
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? ` — ${detail}` : ""}`)
}
function expect(cond, msg) {
  if (!cond) throw new Error(msg)
}

const adminSign = await signIn(TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD)
expect(adminSign.status === 200 && adminSign.cookie, `sign-in admin (${adminSign.status})`)
const aCookie = adminSign.cookie

const point = await dbOne(`select id, name from point_de_vente order by created_at asc limit 1`)
expect(point, "au moins un point de vente en base")
console.log(`info  point de test: « ${point.name} »`)
const adminRowDb = await dbOne(`select id, name from "user" where email = $1`, [TEST_ADMIN_EMAIL])

// ---- 1. création valide (5 champs) ----
const fd1 = new FormData()
fd1.append("pointName", point.name)
fd1.append("format", "6 kg")
fd1.append("status", "disponible")
fd1.append("brand", "Total")
fd1.append("note", "Itinéraire facile")
fd1.append("quantity", "10")
fd1.append("weightKg", "6")
const c1 = await callAction(aCookie, ids.createDisponibiliteAdmin, [null, fd1], "/admin/disponibilites")
record("création valide (5 champs)", c1.result?.ok === true, JSON.stringify(c1.result))

let dispoRow = c1.result?.ok ? await dbOne(`select * from disponibilite where brand = 'Total' and source = 'administration' order by created_at desc limit 1`) : null
record("dispo persistée (brand, source, reportedBy)", !!dispoRow && dispoRow.source === "administration" && dispoRow.reported_by_name === adminRowDb?.name, dispoRow ? `id=${dispoRow.id}` : "aucune")
const dispoId = dispoRow?.id

const brandRow = await dbOne(`select name, name_key from brand where name_key = 'total'`)
record("marque « Total » stockée (clé total)", brandRow?.name === "Total", JSON.stringify(brandRow))

// ---- 2. dédoublonnage marque (casse/espaces) ----
const fd2 = new FormData()
fd2.append("pointName", point.name)
fd2.append("format", "12,5 kg")
fd2.append("status", "disponible")
fd2.append("brand", "total")
fd2.append("note", "Itinéraire moyen")
const c2 = await callAction(aCookie, ids.createDisponibiliteAdmin, [null, fd2], "/admin/disponibilites")
record("création avec marque en minuscules", c2.result?.ok === true, JSON.stringify(c2.result))
const b = await db(`select count(*)::int as c from brand where name_key = 'total'`)
record("marque dédupliquée (total → Total, 1 ligne)", b[0].c === 1, `lignes=${b[0].c}`)

// ---- 3. doublon de dispo active ----
const c3 = await callAction(aCookie, ids.createDisponibiliteAdmin, [null, fd1], "/admin/disponibilites")
record("doublon actif refusé", c3.result?.ok === false && /existe/.test(c3.result?.message || ""), JSON.stringify(c3.result))

// ---- 4. champs manquants ----
const fd4 = new FormData()
fd4.append("pointName", point.name)
fd4.append("format", "6 kg")
fd4.append("status", "disponible")
fd4.append("note", "Itinéraire facile")
const c4 = await callAction(aCookie, ids.createDisponibiliteAdmin, [null, fd4], "/admin/disponibilites")
record("marque manquante → erreur précise", c4.result?.ok === false && /Marque/.test(c4.result?.message || ""), JSON.stringify(c4.result))

// ---- 5. point inconnu ----
const fd5 = new FormData()
fd5.append("pointName", "Point Fantôme XYZ")
fd5.append("format", "6 kg")
fd5.append("status", "disponible")
fd5.append("brand", "Total")
fd5.append("note", "Itinéraire facile")
const c5 = await callAction(aCookie, ids.createDisponibiliteAdmin, [null, fd5], "/admin/disponibilites")
record("point inconnu refusé", c5.result?.ok === false && /introuvable/.test(c5.result?.message || ""), JSON.stringify(c5.result))

// ---- 6. mise à jour ----
if (dispoId) {
  const fdu = new FormData()
  fdu.append("disponibiliteId", dispoId)
  fdu.append("pointId", point.id)
  fdu.append("format", "6 kg")
  fdu.append("status", "a_confirmer")
  fdu.append("brand", "Total")
  fdu.append("note", "Itinéraire facile")
  fdu.append("quantity", "5")
  const cu = await callAction(aCookie, ids.updateDisponibiliteAdmin, [null, fdu], "/admin/disponibilites")
  record("mise à jour dispo", cu.result?.ok === true, JSON.stringify(cu.result))
  const upd = await dbOne(`select status, quantity from disponibilite where id = $1`, [dispoId])
  record("mise à jour persistée", upd?.status === "a_confirmer" && upd?.quantity === 5, JSON.stringify(upd))
}

// ---- 7. suppression de la dispo du test 1 ----
if (dispoId) {
  const fdd = new FormData()
  fdd.append("disponibiliteId", dispoId)
  const cd = await callAction(aCookie, ids.deleteDisponibiliteAdmin, [null, fdd], "/admin/disponibilites")
  record("suppression dispo", cd.result?.ok === true, JSON.stringify(cd.result))
  const gone = await dbOne(`select id from disponibilite where id = $1`, [dispoId])
  record("dispo supprimée en base", !gone)
}

// ---- 8. la marque créée apparaît dans la liste /admin/disponibilites ----
const dispo2Row = c2.result?.ok ? await dbOne(`select id, brand, format from disponibilite where brand = 'Total' and source = 'administration' and format = '12,5 kg' order by created_at desc limit 1`) : null
const adminPage = await getPage("/admin/disponibilites", aCookie)
record("marque « Total » visible dans la liste admin", adminPage.status === 200 && adminPage.text.includes("Total") && adminPage.text.includes("12,5 kg"), `status=${adminPage.status}`)

// ---- 9. isolation collaborateur ----
const collEmail = `collab-${randomUUID().slice(0, 8)}@example.com`
const collPw = "CollabTest123!"
const fdc = new FormData()
fdc.append("name", "Collab Test")
fdc.append("email", collEmail)
fdc.append("password", collPw)
fdc.append("adminRole", "admin")
fdc.append("phoneNumber", "")
const cc = await callAction(aCookie, ids.createAdminCollaborator, [null, fdc], "/admin/collaborateurs")
record("collaborateur créé", cc.result?.ok === true, JSON.stringify(cc.result))

const collRow = cc.result?.ok ? await dbOne(`select id from "user" where email = $1`, [collEmail]) : null
if (cc.result?.ok && collRow) {
  const fdp = new FormData()
  fdp.append("userId", collRow.id)
  fdp.append("modules", "disponibilites,utilisateurs")
  const cp = await callAction(aCookie, ids.setCollaboratorPermissions, [null, fdp], "/admin/collaborateurs")
  record("permissions dispo+users accordées", cp.result?.ok === true, JSON.stringify(cp.result))
}

const collSign = await signIn(collEmail, collPw)
record("connexion collaborateur", collSign.status === 200 && !!collSign.cookie, `status=${collSign.status}`)
const cCookie = collSign.cookie

if (cCookie) {
  const adminRow = await dbOne(`select id from "user" where email = $1`, [TEST_ADMIN_EMAIL])
  const adminPageC = await getPage("/admin", cCookie)
  record("dashboard collaborateur sans activité admin", adminPageC.status === 200 && !adminPageC.text.includes(TEST_ADMIN_EMAIL), `status=${adminPageC.status}`)

  const usersPageC = await getPage("/admin/users", cCookie)
  record("liste users sans comptes d'administration", usersPageC.status === 200 && !usersPageC.text.includes(TEST_ADMIN_EMAIL) && !usersPageC.text.includes(collEmail), `status=${usersPageC.status}`)

  const detailC = await getPage(`/admin/users/${adminRow.id}`, cCookie)
  const blocked = detailC.status >= 300 && detailC.status < 400 && (detailC.location || "").includes("/admin/users")
  record("fiche admin bloquée pour collaborateur", blocked, `status=${detailC.status} location=${detailC.location}`)

  const dispoPageC = await getPage("/admin/disponibilites", cCookie)
  record("page dispo accessible collaborateur", dispoPageC.status === 200, `status=${dispoPageC.status}`)
}

// ---- 10. admin (admin principal) voit la liste complète ----
const usersPageA = await getPage("/admin/users", aCookie)
record("admin voit la liste complète", usersPageA.status === 200 && usersPageA.text.includes(TEST_ADMIN_EMAIL) && usersPageA.text.includes(collEmail), `status=${usersPageA.status}`)

// ---- cleanup ----
if (dispoId) await db(`delete from disponibilite where id = $1`, [dispoId])
if (dispo2Row?.id) await db(`delete from disponibilite where id = $1`, [dispo2Row.id])
await db(`delete from brand where name_key in ('total')`)
if (collRow) {
  await db(`delete from collaborateur_permission where collaborator_id = $1`, [collRow.id])
  await db(`delete from account where user_id = $1`, [collRow.id])
  await db(`delete from "user" where id = $1`, [collRow.id])
}
console.log(`\n${results.filter((r) => r.ok).length}/${results.length} tests OK`)
process.exit(results.every((r) => r.ok) ? 0 : 1)