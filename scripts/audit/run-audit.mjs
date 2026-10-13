import fs from "node:fs";
import path from "node:path";
import * as lib from "./lib.mjs";

// ---- constantes ----
const CLIENT_EMAIL = "audit-client@example.com";
const VB_EMAIL = "test-vendeur-b@example.com";
const ESC_EMAIL = "test-escalade@example.com";
const BOCOM_NAME = "Bocom Deïdo";
const AUDIT_POINT_NAME = "AUDIT Point Test";

// ---- helpers ----
const results = [];

function record(section, id, title, status, detail, kind = "standard") {
  results.push({ section, id, title, status, detail: detail || "", kind });
  const tag = status === "PASS" ? "PASS" : status === "N/A" ? "N/A " : "FAIL";
  console.log(`[${tag}] ${id} — ${title}${detail ? " :: " + detail : ""}`);
}

async function test(section, id, title, kind, fn) {
  try {
    const r = await fn();
    if (r && typeof r === "object" && r.status) {
      record(section, id, title, r.status, r.detail || "", kind);
      return r.status;
    }
    record(section, id, title, "PASS", typeof r === "string" ? r : "", kind);
    return "PASS";
  } catch (err) {
    record(section, id, title, "FAIL", String(err?.message || err).slice(0, 400), kind);
    return "FAIL";
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

function plain(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ");
}

// la classe de badge (ex: bg-amber-500/10) apparaît-elle dans la carte du point ?
function nearTitle(html, title, cls, span = 1400) {
  let i = -1;
  while ((i = html.indexOf(title, i + 1)) !== -1) {
    if (html.slice(i, i + span).includes(cls)) return true;
  }
  return false;
}

async function report(cookie, pointId, status, note, extra = {}) {
  const fd = new FormData();
  fd.append("pointId", pointId);
  fd.append("status", status);
  fd.append("note", note);
  if (extra.quantity !== undefined) fd.append("quantity", String(extra.quantity));
  if (extra.price !== undefined) fd.append("price", String(extra.price));
  if (extra.format !== undefined) fd.append("format", String(extra.format));
  return lib.callAction(cookie, ids.reportDisponibilite, [null, fd]);
}

// ---- setup ----
const ids = lib.loadActionIds();

let vendorA, adminU, bocom, n0, others, snap;
try {
  [vendorA] = await lib.db(`select id, name, email from "user" where email = $1`, [lib.TEST_VENDOR_EMAIL]);
  [adminU] = await lib.db(`select id, name from "user" where email = $1`, [lib.TEST_ADMIN_EMAIL]);
  [bocom] = await lib.db(`select id from point_de_vente where name = $1`, [BOCOM_NAME]);
  if (!vendorA || !adminU || !bocom) {
    throw new Error(`comptes/point manquants (vendor:${!!vendorA} admin:${!!adminU} bocom:${!!bocom})`);
  }
  others = await lib.db(
    `select name from point_de_vente where vendor_id is distinct from $1 order by name`,
    [vendorA.id]
  );
  // purge des lignes de test précédentes puis snapshot des lignes d'origine
  await lib.db(
    `delete from disponibilite where point_id = $1 and (note = 'Smoke test audit' or note like 'AUDIT-%')`,
    [bocom.id]
  );
  snap = await lib.db(`select id, created_at from disponibilite where point_id = $1`, [bocom.id]);
  const [cnt] = await lib.db(`select count(*)::int as c from disponibilite where point_id = $1`, [bocom.id]);
  n0 = cnt.c;
  for (const email of [CLIENT_EMAIL, VB_EMAIL, ESC_EMAIL, "dbg-favori@example.com"]) {
    await lib.db(`delete from "user" where email = $1`, [email]);
  }
  console.log(`— Setup OK — bocom:${bocom.id.slice(0, 8)} lignes d'origine:${n0} autres points:${others.length} —`);
} catch (err) {
  console.log("SETUP ECHOUE:", String(err?.message || err));
  process.exit(1);
}

let cCookie = null;
let vCookie = null;
let aCookie = null;
let bCookie = null;
let clientUserId = null;
let vbUserId = null;
let vbPw = null;

// ================================================================
// A — AUTHENTIFICATION & RÔLES
// ================================================================
await test("A", "T1", "Inscription usager (client)", "standard", async () => {
  const pw = lib.genPassword();
  const su = await lib.signUp({ name: "Audit Client", email: CLIENT_EMAIL, password: pw });
  expect(su.status === 200, `sign-up status ${su.status}`);
  const u = await lib.dbOne(`select id, role from "user" where email = $1`, [CLIENT_EMAIL]);
  expect(u && u.role === `client`, `rôle en base: ${u?.role}`);
  clientUserId = u.id;
  const si = await lib.signIn(CLIENT_EMAIL, pw);
  expect(si.status === 200 && si.cookie, `sign-in status ${si.status}`);
  cCookie = si.cookie;
  const sess = await lib.getSession(cCookie);
  expect(sess.body?.user?.role === "client", `rôle session: ${sess.body?.user?.role}`);
  return "compte créé, sign-in + session rôle client OK";
});

await test("A", "T2", "Inscription vendeur (API : téléphone + rôle)", "standard", async () => {
  const bPw = lib.genPassword();
  vbPw = bPw;
  lib.appendEnv("TEST_VENDOR_B_PASSWORD", bPw);
  const su = await lib.signUp({
    name: "Vendeur B Audit",
    email: VB_EMAIL,
    password: bPw,
    phoneNumber: "+237690000002",
    role: "vendor",
  });
  expect(su.status === 200, `sign-up status ${su.status}`);
  const u = await lib.dbOne(
    `select id, role, phone_number from "user" where email = $1`,
    [VB_EMAIL]
  );
  expect(u?.role === "vendor", `rôle en base: ${u?.role}`);
  expect(u?.phone_number === "+237690000002", `téléphone en base: ${u?.phone_number}`);
  vbUserId = u.id;
  const insc = await lib.getPage("/inscription/vendeur", null);
  expect(insc.status === 200, `/inscription/vendeur ${insc.status}`);
  expect(insc.text.includes("Numéro de téléphone"), "champ téléphone absent de /inscription/vendeur");
  expect(/compte vendeur/i.test(insc.text), "choix de profil vendeur absent de /inscription/vendeur");
  const si = await lib.signIn(VB_EMAIL, bPw);
  expect(si.status === 200 && si.cookie, `sign-in status ${si.status}`);
  bCookie = si.cookie;
  return "rôle vendor + téléphone enregistrés, UI /inscription OK";
});

await test("A", "T3", "Auto-élévation admin via champ role à l'inscription", "standard", async () => {
  const pw = lib.genPassword();
  const su = await lib.signUp({ name: "Escalade Audit", email: ESC_EMAIL, password: pw, role: "admin" });
  expect(su.status === 200, `sign-up status ${su.status}`);
  const u = await lib.dbOne(`select role from "user" where email = $1`, [ESC_EMAIL]);
  if (u?.role === "admin") {
    const si = await lib.signIn(ESC_EMAIL, pw);
    expect(si.status === 200, `sign-in status ${si.status}`);
    const page = await lib.getPage("/dashboard/pro", si.cookie);
    expect(page.status === 200, `accès /dashboard/pro = ${page.status}`);
    throw new Error(
      "FAILLE CONFIRMÉE : sign-up role=admin acceptée ET accès à l'espace administration accordé (compte supprimé après audit)"
    );
  }
  expect(u?.role === "client", `rôle stocké « ${u?.role} » (attendu « client »)`);
  return "tentative role=admin neutralisée : rôle stocké « client »";
});

await test("A", "T4", "Sign-in des 3 comptes et rôles de session", "standard", async () => {
  const v = await lib.signIn(lib.TEST_VENDOR_EMAIL, lib.TEST_VENDOR_PASSWORD);
  expect(v.status === 200 && v.cookie, `vendeur sign-in ${v.status}`);
  vCookie = v.cookie;
  const vs = await lib.getSession(vCookie);
  expect(vs.body?.user?.role === "vendor", `rôle vendeur session: ${vs.body?.user?.role}`);
  const a = await lib.signIn(lib.TEST_ADMIN_EMAIL, lib.TEST_ADMIN_PASSWORD);
  expect(a.status === 200 && a.cookie, `admin sign-in ${a.status}`);
  aCookie = a.cookie;
  const as = await lib.getSession(aCookie);
  expect(as.body?.user?.role === "admin", `rôle admin session: ${as.body?.user?.role}`);
  const cs = await lib.getSession(cCookie);
  expect(cs.body?.user?.role === "client", `rôle client session: ${cs.body?.user?.role}`);
  return "client/vendor/admin : sign-in 200 + rôles OK";
});

await test("A", "T5", "Sign-in avec mot de passe invalide → refus", "standard", async () => {
  const r = await lib.signIn(lib.TEST_USER_EMAIL, "mauvais-mdp-audit-xyz");
  expect(r.status === 401, `statut attendu 401, obtenu ${r.status}`);
  return "401";
});

await test("A", "T6", "Sign-out invalide la session", "standard", async () => {
  const s = await lib.signIn(VB_EMAIL, vbPw);
  expect(s.status === 200 && s.cookie, `sign-in ${s.status}`);
  const out = await lib.signOut(s.cookie);
  expect(out.status === 200, `sign-out ${out.status}`);
  const sess = await lib.getSession(s.cookie);
  const invalid = sess.status === 401 || !sess.body?.user;
  expect(invalid, `session encore valide après sign-out (status ${sess.status})`);
  return "session invalidée";
});

await test("A", "T7", "Garde session sur /profil", "standard", async () => {
  const ok = await lib.getPage("/profil", cCookie);
  expect(ok.status === 200, `/profil avec session = ${ok.status}`);
  const ko = await lib.getPage("/profil", null);
  expect(ko.status === 307 && ko.location === "/connexion", `/profil sans session = ${ko.status} → ${ko.location}`);
  return "200 avec session, 307 /connexion sans";
});

// ================================================================
// B — DASHBOARDS & GARDES
// ================================================================
await test("B", "T8", "/dashboard/pro sans session → /connexion", "standard", async () => {
  const p = await lib.getPage("/dashboard/pro", null);
  expect(p.status === 307 && p.location === "/connexion", `${p.status} → ${p.location}`);
  return "307 /connexion";
});

await test("B", "T9", "/dashboard/pro usager → /dashboard", "standard", async () => {
  const p = await lib.getPage("/dashboard/pro", cCookie);
  expect(p.status === 307 && p.location === "/dashboard", `${p.status} → ${p.location}`);
  return "307 /dashboard";
});

await test("B", "T10", "Espace vendeur : ses dépôts seulement", "standard", async () => {
  const p = await lib.getPage("/dashboard/pro", vCookie);
  expect(p.status === 200, `statut ${p.status}`);
  expect(p.text.includes(BOCOM_NAME), "dépôt Bocom Deïdo absent");
  if (others.length === 0) {
    return { status: "N/A", detail: "aucun point rattaché à un autre vendeur (non concluant)" };
  }
  const leaks = others.filter((o) => p.text.includes(o.name)).map((o) => o.name);
  expect(leaks.length === 0, `points d'autres vendeurs visibles: ${leaks.join(", ")}`);
  return `200, Bocom présent, ${others.length} point(s) d'autres vendeurs non visibles`;
});

await test("B", "T11", "Espace admin : tous les dépôts + liste vendeurs", "standard", async () => {
  const p = await lib.getPage("/dashboard/pro", aCookie);
  expect(p.status === 200, `statut ${p.status}`);
  expect(p.text.includes("Créer un point de vente"), "formulaire admin absent");
  expect(p.text.includes(BOCOM_NAME), "dépôt Bocom Deïdo absent");
  expect(p.text.includes(vendorA.name), `nom vendeur « ${vendorA.name} » absent de la liste admin`);
  return "200, formulaire admin + dépôts + vendeurs présents";
});

await test("B", "T12", "Pages usager protégées (avec/sans session)", "standard", async () => {
  for (const pg of ["/mes-favoris", "/mes-commandes", "/profil"]) {
    const ok = await lib.getPage(pg, cCookie);
    expect(ok.status === 200, `${pg} avec session = ${ok.status}`);
    const ko = await lib.getPage(pg, null);
    expect(ko.status === 307 && ko.location === "/connexion", `${pg} sans session = ${ko.status} → ${ko.location}`);
  }
  return "/mes-favoris, /mes-commandes, /profil : 200 / 307 OK";
});

// ================================================================
// C — FLUX DISPONIBILITÉ (VENDEUR → NEON → USAGER)
// ================================================================
await test("C", "T13", "Signalement « disponible » par le vendeur", "standard", async () => {
  const r = await report(vCookie, bocom.id, "disponible", "AUDIT-13 dispo");
  expect(r.result?.ok === true, `résultat: ${JSON.stringify(r.result)} status ${r.status}`);
  const row = await lib.dbOne(
    `select status, reported_by, source from disponibilite where note = 'AUDIT-13 dispo'`
  );
  expect(row, "ligne absente en base");
  expect(row.status === "disponible", `status ${row.status}`);
  expect(row.reported_by === vendorA.id, `reported_by ${row.reported_by}`);
  expect(row.source === "vendeur", `source ${row.source}`);
  const [cnt] = await lib.db(`select count(*)::int as c from disponibilite where point_id = $1`, [bocom.id]);
  expect(cnt.c === n0 + 1, `compte ${cnt.c} ≠ ${n0}+1`);
  const p = await lib.getPage("/dashboard/pro", vCookie);
  expect(nearTitle(p.text, BOCOM_NAME, "bg-emerald-500/10"), "badge « Disponible » absent près du dépôt");
  return "action ok, ligne signée vendeur, badge affiché";
});

await test("C", "T14", "« indisponible » : append-only (nouveau signalement, pas d'écrasement)", "standard", async () => {
  const [before] = await lib.db(`select count(*)::int as c from disponibilite where point_id = $1`, [bocom.id]);
  const r = await report(vCookie, bocom.id, "indisponible", "AUDIT-14 indispo");
  expect(r.result?.ok === true, `résultat: ${JSON.stringify(r.result)}`);
  const [after] = await lib.db(`select count(*)::int as c from disponibilite where point_id = $1`, [bocom.id]);
  expect(after.c === before.c + 1, `compte ${before.c} → ${after.c} (écrasement ou suppression ?)`);
  const latest = await lib.dbOne(
    `select status from disponibilite where point_id = $1 order by created_at desc limit 1`,
    [bocom.id]
  );
  expect(latest.status === "indisponible", `dernier signalement: ${latest.status}`);
  const p = await lib.getPage("/dashboard/pro", vCookie);
  expect(nearTitle(p.text, BOCOM_NAME, "bg-red-500/10"), "badge « Indisponible » absent près du dépôt");
  return `append-only OK (${before.c}→${after.c}), dernier = indisponible, badge affiché`;
});

await test("C", "T15", "Signalement > 24 h → statut « À confirmer » (effectiveStatus)", "standard", async () => {
  await lib.db(
    `update disponibilite set created_at = now() - interval '26 hours' where point_id = $1`,
    [bocom.id]
  );
  const pro = await lib.getPage("/dashboard/pro", vCookie);
  expect(nearTitle(pro.text, BOCOM_NAME, "bg-amber-500/10"), "badge « À confirmer » absent sur /dashboard/pro");
  const fav = await lib.getPage("/mes-favoris", cCookie);
  expect(fav.status === 200, `/mes-favoris ${fav.status}`);
  expect(nearTitle(fav.text, BOCOM_NAME, "bg-amber-500/10"), "badge « À confirmer » absent sur /mes-favoris");
  expect(plain(fav.text).includes("plus de 24 h"), "avertissement « plus de 24 h » absent");
  return "stale > 24 h → À confirmer + avertissement sur les deux espaces";
});

await test("C", "T16", "Baseline §6 : champs quantité/prix sur le signalement vendeur", "standard", async () => {
  const p = await lib.getPage("/dashboard/pro", vCookie);
  expect(p.status === 200, `statut ${p.status}`);
  const hasForm = p.text.includes("Signaler la disponibilité du gaz");
  expect(hasForm, "formulaire de signalement absent de l'espace vendeur");
  const hasQuantity = /name="quantity"/i.test(p.text);
  const hasPrice = /name="price"/i.test(p.text);
  const hasFormat = /name="format"/i.test(p.text);
  expect(hasQuantity, "champ quantité absent du formulaire");
  expect(hasPrice, "champ prix absent du formulaire");
  expect(hasFormat, "champ format absent du formulaire");

  const r = await report(vCookie, bocom.id, "disponible", "AUDIT-16 qty/prix", {
    quantity: 42,
    price: 3500,
    format: "12,5 kg",
  });
  expect(r.result?.ok === true, `résultat: ${JSON.stringify(r.result)}`);
  const row = await lib.dbOne(
    `select quantity, price, format from disponibilite where note = 'AUDIT-16 qty/prix'`
  );
  expect(row, "ligne absente en base");
  expect(row.quantity === 42, `quantity ${row.quantity}`);
  expect(row.price === 3500, `price ${row.price}`);
  expect(row.format === "12,5 kg", `format ${row.format}`);
  return "champs quantité/prix/format présents et stockés en base";
});

await test("C", "T17", "Baseline §7 : recherche « Trouver du gaz »", "standard", async () => {
  const home = await lib.getPage("/", null);
  expect(home.status === 200, `accueil ${home.status}`);
  expect(home.text.includes("Voir où il y en a"), "formulaire de recherche absent");

  const res = await fetch(`${lib.BASE}/api/recherche?zone=Deïdo`);
  expect(res.status === 200, `API recherche statut ${res.status}`);
  const data = await res.json();
  expect(Array.isArray(data.results), "résultats non tableau");
  expect(data.results.length > 0, "aucun résultat pour Deïdo");
  const bocom = data.results.find((r) => r.name === BOCOM_NAME);
  expect(bocom, `dépôt ${BOCOM_NAME} absent des résultats`);
  expect(bocom.status !== null, "statut de disponibilité manquant");
  expect(typeof bocom.district === "string", "district manquant");
  expect(typeof bocom.address === "string", "adresse manquant");

  const resAll = await fetch(`${lib.BASE}/api/recherche`);
  expect(resAll.status === 200, `API recherche (tous) statut ${resAll.status}`);
  const dataAll = await resAll.json();
  expect(dataAll.results.length >= data.results.length, "recherche sans filtre < recherche filtrée");
  return `API OK : ${data.results.length} résultat(s) pour Deïdo, ${dataAll.results.length} au total`;
});

// ================================================================
// D — ISOLATION & PERMISSIONS
// ================================================================
await test("D", "T18", "Vendeur B signale sur le dépôt du vendeur A → refusé", "standard", async () => {
  const r = await report(bCookie, bocom.id, "disponible", "AUDIT-18 interdit");
  expect(r.result?.ok === false, `résultat: ${JSON.stringify(r.result)}`);
  expect(
    (r.result?.message || "").includes("pas rattaché"),
    `message inattendu: ${r.result?.message}`
  );
  const [cnt] = await lib.db(`select count(*)::int as c from disponibilite where note = 'AUDIT-18 interdit'`);
  expect(cnt.c === 0, `ligne insérée malgré le refus (${cnt.c})`);
  return "refusé, aucune ligne insérée";
});

await test("D", "T19", "Vendeur B ne voit pas le dépôt de vendeur A", "standard", async () => {
  const p = await lib.getPage("/dashboard/pro", bCookie);
  expect(p.status === 200, `statut ${p.status}`);
  expect(!p.text.includes(BOCOM_NAME), "dépôt Bocom Deïdo visible par un autre vendeur");
  expect(!p.text.includes("Créer un point de vente"), "formulaire admin visible par un vendeur");
  expect(p.text.includes("Aucun dépôt rattaché"), "message « Aucun dépôt rattaché » absent");
  return "200 sans dépôt d'autrui ni outils admin";
});

await test("D", "T20", "Actions admin refusées à un vendeur", "standard", async () => {
  const fdCreate = new FormData();
  fdCreate.append("name", "AUDIT-NE-CREER-PAS");
  fdCreate.append("district", "Audit");
  fdCreate.append("address", "123 rue Audit");
  fdCreate.append("vendorId", "__none__");
  const c = await lib.callAction(vCookie, ids.createPointDeVente, [null, fdCreate]);
  expect(c.result?.ok === false, `create: ${JSON.stringify(c.result)}`);
  expect((c.result?.message || "").includes("réservée"), `message: ${c.result?.message}`);
  const fdAssign = new FormData();
  fdAssign.append("pointId", bocom.id);
  fdAssign.append("vendorId", vbUserId);
  const a = await lib.callAction(vCookie, ids.assignVendor, [null, fdAssign]);
  expect(a.result?.ok === false, `assign: ${JSON.stringify(a.result)}`);
  expect((a.result?.message || "").includes("réservée"), `message: ${a.result?.message}`);
  const [ghost] = await lib.db(`select count(*)::int as c from point_de_vente where name = 'AUDIT-NE-CREER-PAS'`);
  expect(ghost.c === 0, "point créé malgré le refus");
  const [bp] = await lib.db(`select vendor_id from point_de_vente where id = $1`, [bocom.id]);
  expect(bp.vendor_id === vendorA.id, `rattachement Bocom modifié: ${bp.vendor_id}`);
  return "createPointDeVente + assignVendor refusés, rien modifié";
});

await test("D", "T21", "Usager appelle reportDisponibilite → redirection", "standard", async () => {
  const [before] = await lib.db(`select count(*)::int as c from disponibilite where point_id = $1`, [bocom.id]);
  const r = await report(cCookie, bocom.id, "disponible", "AUDIT-21 client");
  expect(r.redirect && r.redirect.includes("/dashboard"), `pas de redirection (header x-action-redirect: ${r.redirect}, status ${r.status})`);
  const [after] = await lib.db(`select count(*)::int as c from disponibilite where point_id = $1`, [bocom.id]);
  expect(after.c === before.c, `ligne insérée malgré la redirection (${before.c}→${after.c})`);
  return "redirect /dashboard, aucune ligne";
});

// ================================================================
// E — ADMINISTRATION
// ================================================================
await test("E", "T22", "Admin crée un dépôt, rattache vendeur B, B signale dessus", "standard", async () => {
  const fdCreate = new FormData();
  fdCreate.append("name", AUDIT_POINT_NAME);
  fdCreate.append("district", "Audit");
  fdCreate.append("address", "123 rue Audit");
  fdCreate.append("vendorId", "__none__");
  const c = await lib.callAction(aCookie, ids.createPointDeVente, [null, fdCreate]);
  expect(c.result?.ok === true, `create: ${JSON.stringify(c.result)}`);
  const [pt] = await lib.db(`select id from point_de_vente where name = $1`, [AUDIT_POINT_NAME]);
  expect(pt, "point non créé");
  const fdAssign = new FormData();
  fdAssign.append("pointId", pt.id);
  fdAssign.append("vendorId", vbUserId);
  const a = await lib.callAction(aCookie, ids.assignVendor, [null, fdAssign]);
  expect(a.result?.ok === true, `assign: ${JSON.stringify(a.result)}`);
  const [dbPt] = await lib.db(`select vendor_id from point_de_vente where id = $1`, [pt.id]);
  expect(dbPt.vendor_id === vbUserId, `vendor_id = ${dbPt.vendor_id}`);
  const vbPage = await lib.getPage("/dashboard/pro", bCookie);
  expect(vbPage.text.includes(AUDIT_POINT_NAME), "dépôt absent de l'espace vendeur B");
  const r = await report(bCookie, pt.id, "disponible", "AUDIT-22 B");
  expect(r.result?.ok === true, `signalement B: ${JSON.stringify(r.result)}`);
  const row = await lib.dbOne(`select reported_by, source from disponibilite where note = 'AUDIT-22 B'`);
  expect(row?.reported_by === vbUserId, `reported_by = ${row?.reported_by}`);
  expect(row?.source === "vendeur", `source = ${row?.source}`);
  return "création + rattachement + signalement du vendeur B OK";
});

await test("E", "T23", "Admin signale sur un dépôt vendeur (source « administration »)", "standard", async () => {
  const r = await report(aCookie, bocom.id, "disponible", "AUDIT-23 admin");
  expect(r.result?.ok === true, `résultat: ${JSON.stringify(r.result)}`);
  const row = await lib.dbOne(
    `select reported_by, source from disponibilite where note = 'AUDIT-23 admin'`
  );
  expect(row?.reported_by === adminU.id, `reported_by = ${row?.reported_by}`);
  expect(row?.source === "administration", `source = ${row?.source}`);
  return "admin peut signaler, source=administration";
});

// ================================================================
// F — ACTIONS USAGER
// ================================================================
await test("F", "T24", "Favori : ajout, affichage, retrait", "standard", async () => {
  const add = await lib.callAction(cCookie, ids.toggleFavori, [bocom.id], "/mes-favoris");
  expect(add.status === 200 && !add.notFound, `ajout: status ${add.status} notFound ${add.notFound}`);
  let rows = await lib.db(
    `select id from favori where user_id = $1 and point_id = $2`,
    [clientUserId, bocom.id]
  );
  expect(rows.length === 1, `favoris en base: ${rows.length}`);
  const page = await lib.getPage("/mes-favoris", cCookie);
  expect(plain(page.text).includes("Mes favoris (1)"), "compteur « Mes favoris (1) » absent");
  const rem = await lib.callAction(cCookie, ids.toggleFavori, [bocom.id], "/mes-favoris");
  expect(rem.status === 200 && !rem.notFound, `retrait: status ${rem.status}`);
  rows = await lib.db(
    `select id from favori where user_id = $1 and point_id = $2`,
    [clientUserId, bocom.id]
  );
  expect(rows.length === 0, `favoris restants: ${rows.length}`);
  const page2 = await lib.getPage("/mes-favoris", cCookie);
  expect(plain(page2.text).includes("Mes favoris (0)"), "compteur « Mes favoris (0) » absent");
  return "ajout → (1) → retrait → (0)";
});

await test("F", "T25", "Recharge : création, affichage, suppression", "standard", async () => {
  const fd = new FormData();
  fd.append("pointName", BOCOM_NAME);
  fd.append("format", "12,5 kg");
  fd.append("price", "5000");
  fd.append("date", "2026-10-01");
  const add = await lib.callAction(cCookie, ids.addRecharge, [null, fd], "/mes-commandes");
  expect(add.result?.ok === true, `ajout: ${JSON.stringify(add.result)}`);
  const row = await lib.dbOne(
    `select id, price, format from recharge where user_id = $1 and point_name = $2 order by created_at desc limit 1`,
    [clientUserId, BOCOM_NAME]
  );
  expect(row, "recharge absente en base");
  expect(row.price === 5000 && row.format === "12,5 kg", `price=${row.price} format=${row.format}`);
  const page = await lib.getPage("/mes-commandes", cCookie);
  expect(page.status === 200, `/mes-commandes ${page.status}`);
  expect(plain(page.text).includes(BOCOM_NAME), "dépôt absent de /mes-commandes");
  const fdDel = new FormData();
  fdDel.append("id", row.id);
  const del = await lib.callAction(cCookie, ids.deleteRecharge, [null, fdDel], "/mes-commandes");
  expect(del.result?.ok === true, `suppression: ${JSON.stringify(del.result)}`);
  const [cnt] = await lib.db(`select count(*)::int as c from recharge where id = $1`, [row.id]);
  expect(cnt.c === 0, "recharge toujours présente");
  return "création → affichage → suppression OK";
});

await test("A", "T27", "Google OAuth : endpoint social renvoie vers Google", "standard", async () => {
  const res = await fetch(`${lib.BASE}/api/auth/sign-in/social`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: lib.BASE },
    body: JSON.stringify({ provider: "google", callbackURL: "/dashboard" }),
  });
  let body = null;
  try {
    body = await res.json();
  } catch {}
  const url = String(body?.url || res.headers.get("location") || "");
  let display = url;
  try {
    const u = new URL(url);
    display = u.host + u.pathname;
  } catch {}
  expect(res.status === 200 || res.status === 302, `statut ${res.status} (${display})`);
  expect(url.includes("accounts.google.com"), `redirection inattendue: ${display}`);
  expect(url.includes("client_id="), "client_id absent de la redirection Google");
  return "200 → accounts.google.com avec client_id (config GOOGLE_* lue)";
});

// ================================================================
// CLEANUP
// ================================================================
const cleanupNotes = [];
async function cleanup() {
  try {
    await lib.db(
      `delete from disponibilite where point_id = $1 and (note like 'AUDIT-%' or note = 'Smoke test audit')`,
      [bocom.id]
    );
    for (const r of snap) {
      await lib.db(`update disponibilite set created_at = $2 where id = $1`, [r.id, r.created_at]);
    }
    const [auditPt] = await lib.db(`select id from point_de_vente where name = $1`, [AUDIT_POINT_NAME]);
    if (auditPt) {
      await lib.db(`delete from point_de_vente where id = $1`, [auditPt.id]);
    }
    await lib.db(`delete from "user" where email in ($1, $2)`, [CLIENT_EMAIL, ESC_EMAIL]);
    cleanupNotes.push("lignes de test supprimées, createdAt restaurés, comptes jetables supprimés");
  } catch (err) {
    cleanupNotes.push(`ERREUR nettoyage: ${String(err?.message || err).slice(0, 300)}`);
  }
}
await cleanup();

await test("H", "T26", "Nettoyage vérifié", "standard", async () => {
  const [cnt] = await lib.db(`select count(*)::int as c from disponibilite where point_id = $1`, [bocom.id]);
  expect(cnt.c === snap.length, `lignes Bocom: ${cnt.c} ≠ snapshot ${snap.length}`);
  const [ghosts] = await lib.db(
    `select count(*)::int as c from "user" where email in ($1, $2)`,
    [CLIENT_EMAIL, ESC_EMAIL]
  );
  expect(ghosts.c === 0, `comptes jetables restants: ${ghosts.c}`);
  const [pt] = await lib.db(`select count(*)::int as c from point_de_vente where name = $1`, [AUDIT_POINT_NAME]);
  expect(pt.c === 0, "point de test restant");
  const [vb] = await lib.db(`select role from "user" where email = $1`, [VB_EMAIL]);
  expect(vb?.role === "vendor", `compte vendeur B: ${vb?.role}`);
  const envNow = fs.readFileSync(path.join(lib.ROOT, ".env"), "utf8");
  expect(/^TEST_VENDOR_B_PASSWORD=.+/m.test(envNow), "TEST_VENDOR_B_PASSWORD absent de .env");
  return "Bocom restauré, jetables supprimés, vendeur B conservé (voir .env)";
});

// ================================================================
// RAPPORT
// ================================================================
const standardFails = results.filter((r) => r.status === "FAIL" && r.kind === "standard");
const baselineFails = results.filter((r) => r.status === "FAIL" && r.kind === "baseline");
const passes = results.filter((r) => r.status === "PASS");
const nas = results.filter((r) => r.status === "N/A");

const sections = [];
for (const r of results) {
  let sec = sections.find((s) => s.name === r.section);
  if (!sec) {
    sec = { name: r.section, items: [] };
    sections.push(sec);
  }
  sec.items.push(r);
}
const sectionTitles = {
  A: "Authentification & rôles",
  B: "Dashboards & gardes",
  C: "Flux disponibilité (vendeur → Neon → usager)",
  D: "Isolation & permissions",
  E: "Administration",
  F: "Actions usager",
  H: "Nettoyage",
};

let md = `# Audit E2E GazPoints — comptes USER / VENDEUR / ADMIN\n\n`;
md += `Date : ${nowISO()} — exécutant : \`scripts/audit/run-audit.mjs\` (tests HTTP automatisés contre le serveur dev Next 16)\n\n`;
md += `Résumé : **${passes.length} PASS**, **${standardFails.length} FAIL**, **${baselineFails.length} FAIL baseline** (attendus, corrigés par T1/T2), ${nas.length} N/A\n\n`;

md += `## COMPTES\n\n`;
md += `| Compte | Rôle | Mot de passe |\n|---|---|---|\n`;
md += `| ${lib.TEST_USER_EMAIL} | usager (client) | \`.env\` → \`TEST_USER_PASSWORD\` |\n`;
md += `| ${lib.TEST_VENDOR_EMAIL} | vendeur (dépôt ${BOCOM_NAME}) | \`.env\` → \`TEST_VENDOR_PASSWORD\` |\n`;
md += `| ${lib.TEST_ADMIN_EMAIL} | admin | \`.env\` → \`TEST_ADMIN_PASSWORD\` |\n`;
md += `| ${VB_EMAIL} | vendeur B (créé par l'audit) | \`.env\` → \`TEST_VENDOR_B_PASSWORD\` |\n`;
md += `| ${CLIENT_EMAIL} | usager jetable | supprimé à la fin de l'audit |\n`;
md += `| ${ESC_EMAIL} | test auto-élévation admin | supprimé à la fin de l'audit |\n\n`;
md += `Les mots de passe ne sont jamais affichés ici — consultez \`.env\`.\n\n`;

md += `## TESTS\n\n`;
for (const s of sections) {
  md += `### ${s.name} — ${sectionTitles[s.name] || ""}\n\n`;
  md += `| # | Test | Résultat | Détail |\n|---|---|---|---|\n`;
  for (const r of s.items) {
    md += `| ${r.id} | ${r.title} | **${r.status}**${r.kind !== "standard" ? ` (${r.kind})` : ""} | ${r.detail.replace(/\|/g, "\\|")} |\n`;
  }
  md += `\n`;
}

md += `## PROBLÈMES\n\n`;
if (standardFails.length === 0) {
  md += `Aucun échec hors baseline.\n\n`;
} else {
  standardFails.forEach((r, i) => {
    md += `${i + 1}. **[${r.kind.toUpperCase()}] ${r.id} — ${r.title}** : ${r.detail}\n`;
  });
  md += `\n`;
}
if (baselineFails.length > 0) {
  md += `### Attendus (baseline — couverts par les plans T1 / T2)\n\n`;
  baselineFails.forEach((r, i) => {
    md += `${i + 1}. **${r.id} — ${r.title}** : ${r.detail}\n`;
  });
  md += `\n`;
}

md += `### Recommandations\n\n`;
md += `1. **Rotation du mot de passe Neon (DATABASE_URL)** : une commande d'audit a affiché l'URL de connexion complète (incluant le secret) dans un terminal — la valeur doit être considérée comme compromise et régénérée dans Neon.\n`;
if (standardFails.some((r) => r.id === "T3")) {
  md += `2. **Faille critique : auto-élévation admin** — le champ \`role\` est accepté à l'inscription (\`input: true\`). Restreindre la définition du rôle côté serveur (voir plan T1).\n`;
}
md += `\n### Nettoyage\n\n- ${cleanupNotes.join("\n- ")}\n`;

const reportPath = path.join(lib.ROOT, "scripts", "audit", "rapport-audit.md");
fs.writeFileSync(reportPath, md, "utf8");

console.log("\n=== SYNTHESE ===");
console.log(`PASS: ${passes.length} | FAIL: ${standardFails.length} | FAIL baseline: ${baselineFails.length} | N/A: ${nas.length}`);
for (const r of [...standardFails, ...baselineFails]) {
  console.log(`  - [${r.kind}] ${r.id} ${r.title} :: ${r.detail}`);
}
console.log(`Rapport: ${reportPath}`);

process.exitCode = standardFails.length > 0 ? 1 : 0;

function nowISO() {
  return new Date().toISOString().slice(0, 19).replace("T", " ");
}
