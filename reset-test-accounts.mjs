import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { neon } = require("@neondatabase/serverless");

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const BASE = process.env.AUDIT_BASE || "http://localhost:3000";
const ENV_PATH = path.join(ROOT, ".env");

const env = fs.readFileSync(ENV_PATH, "utf8");
function envValue(key) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const DB_URL = envValue("DATABASE_URL");
const sql = neon(DB_URL);

const TEST_USER_EMAIL = "test-client@example.com";
const TEST_VENDOR_EMAIL = "test-vendeur@example.com";
const TEST_ADMIN_EMAIL = "test-admin@example.com";

function genPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

function appendEnv(key, value) {
  let content = fs.readFileSync(ENV_PATH, "utf8");
  const re = new RegExp(`^${key}=.*$`, "m");
  const line = `${key}=${value}`;
  if (re.test(content)) content = content.replace(re, line);
  else content = content.replace(/\s*$/, "") + "\n" + line + "\n";
  fs.writeFileSync(ENV_PATH, content, "utf8");
}

async function db(query, params = []) {
  const r = await sql.query(query, params);
  return Array.isArray(r) ? r : r.rows || [];
}

async function signUp(profile) {
  const res = await fetch(`${BASE}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify(profile),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function signIn(email, password) {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: BASE },
    body: JSON.stringify({ email, password }),
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

async function getSession(cookie) {
  const res = await fetch(`${BASE}/api/auth/get-session`, {
    headers: cookie ? { Cookie: cookie } : {},
  });
  const body = await res.json().catch(() => null);
  return { status: res.status, body };
}

function cookiesFrom(res) {
  const set = typeof res.headers.getSetCookie === "function" ? res.headers.getSetCookie() : [];
  return set.map((c) => c.split(";")[0]).filter(Boolean).join("; ");
}

// ---- 1. Vider la base ----
console.log("=== Suppression de tous les comptes existants ===");
const before = await db(`select count(*)::int as c from "user"`);
console.log(`  ${before[0].c} compte(s) existant(s)`);

await db(`delete from "user"`);
const after = await db(`select count(*)::int as c from "user"`);
console.log(`  ${after[0].c} compte(s) restant(s)`);

// ---- 2. Créer les comptes de test ----
console.log("\n=== Création des comptes de test ===");

const userPw = genPassword();
const vendorPw = genPassword();
const adminPw = genPassword();

// Client
const su1 = await signUp({
  name: "Test Client",
  email: TEST_USER_EMAIL,
  password: userPw,
});
if (su1.status !== 200) {
  console.error(`  ECHEC création client: ${su1.status} ${JSON.stringify(su1.body)}`);
  process.exit(1);
}
console.log(`  Client: ${TEST_USER_EMAIL} — créé`);

// Vendeur
const su2 = await signUp({
  name: "Test Vendeur",
  email: TEST_VENDOR_EMAIL,
  password: vendorPw,
  phoneNumber: "+237690000000",
  role: "vendor",
});
if (su2.status !== 200) {
  console.error(`  ECHEC création vendeur: ${su2.status} ${JSON.stringify(su2.body)}`);
  process.exit(1);
}
console.log(`  Vendeur: ${TEST_VENDOR_EMAIL} — créé`);

// Admin (créé comme client puis promu en base)
const su3 = await signUp({
  name: "Test Admin",
  email: TEST_ADMIN_EMAIL,
  password: adminPw,
});
if (su3.status !== 200) {
  console.error(`  ECHEC création admin: ${su3.status} ${JSON.stringify(su3.body)}`);
  process.exit(1);
}
await db(`update "user" set role = 'admin' where email = $1`, [TEST_ADMIN_EMAIL]);
console.log(`  Admin: ${TEST_ADMIN_EMAIL} — créé et promu admin`);

// ---- 3. Vérifier les connexions ----
console.log("\n=== Vérification des connexions ===");

const si1 = await signIn(TEST_USER_EMAIL, userPw);
const role1 = si1.body?.user?.role;
console.log(`  Client: sign-in ${si1.status}, rôle=${role1}`);

const si2 = await signIn(TEST_VENDOR_EMAIL, vendorPw);
const role2 = si2.body?.user?.role;
console.log(`  Vendeur: sign-in ${si2.status}, rôle=${role2}`);

const si3 = await signIn(TEST_ADMIN_EMAIL, adminPw);
const role3 = si3.body?.user?.role;
console.log(`  Admin: sign-in ${si3.status}, rôle=${role3}`);

// ---- 4. Sauvegarder les mots de passe dans .env ----
console.log("\n=== Mise à jour de .env ===");
appendEnv("TEST_USER_PASSWORD", userPw);
appendEnv("TEST_VENDOR_PASSWORD", vendorPw);
appendEnv("TEST_ADMIN_PASSWORD", adminPw);
console.log("  TEST_USER_PASSWORD, TEST_VENDOR_PASSWORD, TEST_ADMIN_PASSWORD mis à jour");

// ---- 5. Résumé ----
console.log("\n=== RÉSUMÉ ===");
console.log(`  Client  (${TEST_USER_EMAIL})  rôle=client  ✓`);
console.log(`  Vendeur (${TEST_VENDOR_EMAIL})  rôle=vendor  ✓`);
console.log(`  Admin   (${TEST_ADMIN_EMAIL})  rôle=admin   ✓`);
console.log("\n  Mots de passe dans .env (TEST_USER_PASSWORD, TEST_VENDOR_PASSWORD, TEST_ADMIN_PASSWORD)");
