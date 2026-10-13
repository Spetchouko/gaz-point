import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { neon } = require("@neondatabase/serverless");
const { hashPassword } = require("better-auth/crypto");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
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

function createId(size = 32) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) out += chars[bytes[i] % chars.length];
  return out;
}

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

async function main() {
  console.log("=== Suppression des comptes de test existants ===");
  await sql.query(`delete from "user" where email in ($1, $2, $3)`, [TEST_USER_EMAIL, TEST_VENDOR_EMAIL, TEST_ADMIN_EMAIL]);
  console.log("  Comptes existants supprimés");
  
  const userPw = genPassword();
  const vendorPw = genPassword();
  const adminPw = genPassword();
  
  console.log("\n=== Création des comptes de test ===");
  
  // Client
  const userId = createId();
  const hashed = await hashPassword(userPw);
  await sql.query(
    `insert into "user" (id, name, email, email_verified, role, phone_verified, created_at, updated_at) values ($1, $2, $3, true, $4, false, now(), now())`,
    [userId, "Test Client", TEST_USER_EMAIL, "client"]
  );
  await sql.query(
    `insert into "account" (id, account_id, provider_id, user_id, password, created_at, updated_at) values ($1, $2, $3, $4, $5, now(), now())`,
    [createId(), userId, "credential", userId, hashed]
  );
  console.log(`  Client: ${TEST_USER_EMAIL} — créé`);
  
  // Vendeur
  const vendorId = createId();
  const vendorHashed = await hashPassword(vendorPw);
  await sql.query(
    `insert into "user" (id, name, email, email_verified, role, phone_verified, phone_number, created_at, updated_at) values ($1, $2, $3, true, $4, false, $5, now(), now())`,
    [vendorId, "Test Vendeur", TEST_VENDOR_EMAIL, "vendor", "+237690000000"]
  );
  await sql.query(
    `insert into "account" (id, account_id, provider_id, user_id, password, created_at, updated_at) values ($1, $2, $3, $4, $5, now(), now())`,
    [createId(), vendorId, "credential", vendorId, vendorHashed]
  );
  console.log(`  Vendeur: ${TEST_VENDOR_EMAIL} — créé`);
  
  // Admin
  const adminId = createId();
  const adminHashed = await hashPassword(adminPw);
  await sql.query(
    `insert into "user" (id, name, email, email_verified, role, phone_verified, created_at, updated_at) values ($1, $2, $3, true, $4, false, now(), now())`,
    [adminId, "Test Admin", TEST_ADMIN_EMAIL, "admin"]
  );
  await sql.query(
    `insert into "account" (id, account_id, provider_id, user_id, password, created_at, updated_at) values ($1, $2, $3, $4, $5, now(), now())`,
    [createId(), adminId, "credential", adminId, adminHashed]
  );
  console.log(`  Admin: ${TEST_ADMIN_EMAIL} — créé`);
  
  // Save passwords to .env
  appendEnv("TEST_USER_PASSWORD", userPw);
  appendEnv("TEST_VENDOR_PASSWORD", vendorPw);
  appendEnv("TEST_ADMIN_PASSWORD", adminPw);
  
  console.log("\n=== Mots de passe sauvegardés dans .env ===");
  console.log(`  Client  (${TEST_USER_EMAIL})  rôle=client  ✓`);
  console.log(`  Vendeur (${TEST_VENDOR_EMAIL})  rôle=vendor  ✓`);
  console.log(`  Admin   (${TEST_ADMIN_EMAIL})  rôle=admin   ✓`);
}

main().catch(console.error);