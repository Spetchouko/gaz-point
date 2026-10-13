import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { hashPassword } from "better-auth/crypto";

const require = createRequire(import.meta.url);
const { neon } = require("@neondatabase/serverless");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const args = process.argv.slice(2);
function argValue(name) {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
}

const email = (argValue("--email") || "petchouko@gmail.com").trim().toLowerCase();
const name = argValue("--name") || "Admin GazPoints";
const passwordFile = argValue("--password-file");

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  const env = fs.readFileSync(path.join(ROOT, ".env"), "utf8");
  const m = env.match(/^DATABASE_URL=(.+)$/m);
  dbUrl = m && m[1].trim().replace(/^["']|["']$/g, "");
}
if (!dbUrl) {
  console.error("DATABASE_URL introuvable.");
  process.exit(1);
}

let password = process.env.ADMIN_PASSWORD;
if (!password && passwordFile) {
  password = fs.readFileSync(passwordFile, "utf8").replace(/\r?\n$/, "");
}
if (!password) {
  console.error("Mot de passe manquant (--password-file ou ADMIN_PASSWORD).");
  process.exit(1);
}
if (password.length < 8) {
  console.error("Mot de passe trop court (>= 8 caractères).");
  process.exit(1);
}

const sql = neon(dbUrl);
const rows = (r) => (Array.isArray(r) ? r : r.rows || []);

function createId(size = 32) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const bytes = crypto.randomBytes(size);
  let out = "";
  for (let i = 0; i < size; i++) out += chars[bytes[i] % chars.length];
  return out;
}

const existing = rows(
  await sql.query(`select id from "user" where email = $1`, [email])
);

if (existing[0]) {
  const userId = existing[0].id;
  const hashed = await hashPassword(password);
  await sql.query(
    `update "user" set role = 'admin', email_verified = true, updated_at = now() where id = $1`,
    [userId]
  );
  const cred = rows(
    await sql.query(
      `select id from "account" where user_id = $1 and provider_id = 'credential'`,
      [userId]
    )
  );
  if (cred[0]) {
    await sql.query(
      `update "account" set password = $1, updated_at = now() where id = $2`,
      [hashed, cred[0].id]
    );
  } else {
    await sql.query(
      `insert into "account" (id, account_id, provider_id, user_id, password, created_at, updated_at) values ($1, $2, 'credential', $3, $4, now(), now())`,
      [createId(), userId, userId, hashed]
    );
  }
  console.log("Compte existant promu en admin :", email);
} else {
  const userId = createId();
  const hashed = await hashPassword(password);
  await sql.query(
    `insert into "user" (id, name, email, email_verified, role, phone_verified, created_at, updated_at) values ($1, $2, $3, true, 'admin', false, now(), now())`,
    [userId, name, email]
  );
  await sql.query(
    `insert into "account" (id, account_id, provider_id, user_id, password, created_at, updated_at) values ($1, $2, 'credential', $3, $4, now(), now())`,
    [createId(), userId, userId, hashed]
  );
  console.log("Compte admin créé :", email);
}

const check = rows(
  await sql.query(
    `select email, role, email_verified from "user" where email = $1`,
    [email]
  )
);
console.log("VERIF", JSON.stringify(check));
