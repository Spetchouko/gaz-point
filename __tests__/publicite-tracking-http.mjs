import fs from "node:fs";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { neon } = require("@neondatabase/serverless");

const BASE = process.env.BASE_URL || "http://localhost:3000";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const env = fs.readFileSync(".env", "utf8");
  dbUrl = env.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
}
const sql = neon(dbUrl);

let pass = 0;
const failures = [];
function check(name, cond, detail) {
  if (cond) {
    pass++;
    console.log(`  PASS ${name}`);
  } else {
    failures.push(name);
    console.log(`  FAIL ${name}${detail === undefined ? "" : ` — ${detail}`}`);
  }
}

const tempId = `ZZTEST_ADSHTTP_${randomUUID()}`;

async function postEvent(payload, extraHeaders = {}) {
  return fetch(`${BASE}/api/ads/event`, {
    method: "POST",
    headers: { "content-type": "application/json", ...extraHeaders },
    body: JSON.stringify(payload),
  });
}

async function main() {
  // Préflight : le serveur doit répondre.
  const home = await fetch(BASE).catch(() => null);
  if (!home) {
    console.error(`Serveur indisponible sur ${BASE}`);
    process.exit(2);
  }

  console.log("\n[0] Préparation");
  await sql.query(
    `INSERT INTO publicite (id, title, slot, status) VALUES ($1, $2, 'home_search', 'active')`,
    [tempId, "ZZTEST_ADSHTTP"]
  );
  const adRows = await sql.query("SELECT id, slot FROM publicite WHERE id = $1", [tempId]);
  check("publicité temporaire créée", adRows.length === 1);

  console.log("\n[1] Validation de la route");
  const noConsent = await postEvent({ publiciteId: tempId, eventType: "impression", eventKey: `e:${randomUUID()}` });
  check("consentement manquant → 403", noConsent.status === 403, `status ${noConsent.status}`);

  const badType = await postEvent({ publiciteId: tempId, eventType: "conversion", eventKey: `e:${randomUUID()}`, consented: true });
  check("type 'conversion' refusé → 400", badType.status === 400, `status ${badType.status}`);

  const nonsense = await postEvent({ publiciteId: tempId, eventType: "nawak", eventKey: `e:${randomUUID()}`, consented: true });
  check("type inconnu refusé → 400", nonsense.status === 400, `status ${nonsense.status}`);

  const missing = await postEvent({ publiciteId: "", eventType: "impression", eventKey: "", consented: true });
  check("champs manquants refusés → 400", missing.status === 400, `status ${missing.status}`);

  console.log("\n[2] Impression réellement enregistrée");
  const impKey = `imp:${tempId}:visitor:${randomUUID()}`;
  const imp = await postEvent({
    publiciteId: tempId,
    eventType: "impression",
    eventKey: impKey,
    visitorId: "visitor-1",
    sessionId: "session-1",
    path: "/",
    referrer: "https://www.google.com/search?q=gaz",
    consented: true,
  });
  check("impression acceptée → 204", imp.status === 204, `status ${imp.status}`);
  const impRows = await sql.query("SELECT event_type, slot, source_category, referrer_host, consented FROM publicite_event WHERE event_key = $1", [impKey]);
  check("impression en base", impRows.length === 1, `rows ${impRows.length}`);
  check("event_type = impression", impRows[0]?.event_type === "impression");
  check("slot mémorisé (home_search)", impRows[0]?.slot === "home_search");
  check("source classée 'search' (Google)", impRows[0]?.source_category === "search", impRows[0]?.source_category);
  check("referrer_host = www.google.com", impRows[0]?.referrer_host === "www.google.com", impRows[0]?.referrer_host);
  check("consented = true", impRows[0]?.consented === true);

  console.log("\n[3] Anti-double comptage (même eventKey)");
  await postEvent({ publiciteId: tempId, eventType: "impression", eventKey: impKey, consented: true });
  const dupCount = await sql.query("SELECT count(*)::int AS n FROM publicite_event WHERE event_key = $1", [impKey]);
  check("même eventKey envoyé 2x → 1 ligne", dupCount[0].n === 1, `n=${dupCount[0].n}`);

  console.log("\n[4] Clic + cookie d'attribution");
  const clickKey = `clk:${tempId}:${randomUUID()}`;
  const click = await postEvent({
    publiciteId: tempId,
    eventType: "click",
    eventKey: clickKey,
    visitorId: "visitor-1",
    sessionId: "session-1",
    path: "/",
    utmSource: "newsletter",
    consented: true,
  });
  check("clic accepté → 204", click.status === 204, `status ${click.status}`);
  const setCookies = click.headers.getSetCookie ? click.headers.getSetCookie() : [];
  const refCookie = setCookies.find((c) => c.startsWith("gz_ad_ref="));
  check("cookie gz_ad_ref déposé", Boolean(refCookie), JSON.stringify(setCookies));
  check("cookie HttpOnly", /HttpOnly/i.test(refCookie || ""));
  check("cookie SameSite=Lax", /SameSite=Lax/i.test(refCookie || ""));
  const clickRow = await sql.query("SELECT event_type, attribution_window_days, source_category FROM publicite_event WHERE event_key = $1", [clickKey]);
  check("clic en base avec fenêtre 30 j", clickRow[0]?.event_type === "click" && clickRow[0]?.attribution_window_days === 30, JSON.stringify(clickRow[0]));
  check("source classée 'campaign' (UTM)", clickRow[0]?.source_category === "campaign", clickRow[0]?.source_category);

  console.log("\n[5] Publicité inexistante ignorée");
  const ghostKey = `imp:ghost:${randomUUID()}`;
  const ghost = await postEvent({ publiciteId: `ZZGHOST_${randomUUID()}`, eventType: "impression", eventKey: ghostKey, consented: true });
  check("publicité inconnue → 204 (ignoré)", ghost.status === 204, `status ${ghost.status}`);
  const ghostRows = await sql.query("SELECT count(*)::int AS n FROM publicite_event WHERE event_key = $1", [ghostKey]);
  check("aucune ligne créée pour une publicité inconnue", ghostRows[0].n === 0);

  console.log("\n[6] Conversion via /api/recherche (attribution au clic)");
  const cookieValue = (refCookie || "").split(";")[0]; // "gz_ad_ref=..."
  const before = await sql.query("SELECT count(*)::int AS n FROM publicite_event WHERE publicite_id = $1 AND event_type = 'conversion'", [tempId]);
  const search = await fetch(`${BASE}/api/recherche?brand=Total`, { headers: { cookie: cookieValue } });
  check("recherche répond 200", search.status === 200, `status ${search.status}`);
  await search.json().catch(() => ({}));
  const after = await sql.query("SELECT count(*)::int AS n FROM publicite_event WHERE publicite_id = $1 AND event_type = 'conversion' AND conversion_type = 'search'", [tempId]);
  check("conversion 'search' enregistrée après recherche", after[0].n === before[0].n + 1, `before=${before[0].n} after=${after[0].n}`);

  const search2 = await fetch(`${BASE}/api/recherche?brand=Total`, { headers: { cookie: cookieValue } });
  await search2.json().catch(() => ({}));
  const after2 = await sql.query("SELECT count(*)::int AS n FROM publicite_event WHERE publicite_id = $1 AND event_type = 'conversion' AND conversion_type = 'search'", [tempId]);
  check("recherche suivante → pas de doublon de conversion", after2[0].n === after[0].n, `n=${after2[0].n}`);

  console.log("\n[7] Nettoyage");
  await sql.query("DELETE FROM publicite WHERE id = $1", [tempId]);
  const leftover = await sql.query("SELECT count(*)::int AS n FROM publicite WHERE id = $1", [tempId]);
  check("publicité temporaire supprimée", leftover[0].n === 0);
  const evLeft = await sql.query("SELECT count(*)::int AS n FROM publicite_event WHERE publicite_id = $1", [tempId]);
  check("événements supprimés en cascade", evLeft[0].n === 0);

  console.log(`\nRÉSULTAT HTTP: ${pass} PASS / ${failures.length} FAIL`);
  if (failures.length > 0) {
    console.log("Échecs:", failures.join(" | "));
    process.exit(1);
  }
}

main().catch(async (error) => {
  console.error("Erreur de test HTTP:", error);
  try {
    await sql.query("DELETE FROM publicite WHERE id = $1", [tempId]);
  } catch {
    // ignore
  }
  process.exit(1);
});
