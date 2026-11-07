/* Diagnostic : rejoue les requêtes du dashboard admin pour capturer l'erreur SQL exacte. */
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL manquant");
  process.exit(1);
}

const sql = neon(url);

async function main() {
  // 1. Requête simple : count utilisateurs
  try {
    const r1 = await sql`select count(*) from "user"`;
    console.log("OK count(user):", JSON.stringify(r1));
  } catch (e) {
    console.error("FAIL count(user):", e.message);
  }

  // 2. Requête avec date (comme le dashboard) — Date JS native
  try {
    const d = new Date(Date.now() - 7 * 24 * 3600 * 1000);
    const r2 = await sql`select count(*) from "user" where "created_at" >= ${d}`;
    console.log("OK count(user) with Date param:", JSON.stringify(r2));
  } catch (e) {
    console.error("FAIL count(user) with Date param:", e.message);
  }

  // 3. Requête exacte du log qui échoue
  try {
    const r3 = await sql`select "id", "point_id", "vendor_id", "status", "created_at" from "disponibilite" where "disponibilite"."created_at" >= ${new Date(Date.now() - 7 * 24 * 3600 * 1000)} order by "disponibilite"."created_at" desc limit 5`;
    console.log("OK recentDispos:", JSON.stringify(r3));
  } catch (e) {
    console.error("FAIL recentDispos:", e.message);
  }

  // 4. Lister les colonnes de la table user
  try {
    const r4 = await sql`select column_name, data_type from information_schema.columns where table_name = 'user' order by ordinal_position`;
    console.log("user columns:", JSON.stringify(r4));
  } catch (e) {
    console.error("FAIL columns(user):", e.message);
  }

  // 5. Lister les colonnes de la table disponibilite
  try {
    const r5 = await sql`select column_name, data_type from information_schema.columns where table_name = 'disponibilite' order by ordinal_position`;
    console.log("disponibilite columns:", JSON.stringify(r5));
  } catch (e) {
    console.error("FAIL columns(disponibilite):", e.message);
  }

  // 6. Rôles existants
  try {
    const r6 = await sql`select role, count(*) from "user" group by role`;
    console.log("roles:", JSON.stringify(r6));
  } catch (e) {
    console.error("FAIL roles:", e.message);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error("FATAL", e); process.exit(1); });
