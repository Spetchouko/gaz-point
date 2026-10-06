import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { hashPassword } from "better-auth/crypto";
import { neon } from "@neondatabase/serverless";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENV_PATH = path.join(ROOT, ".env");

const TARGETS = [
  { key: "TEST_USER_PASSWORD", email: "test-client@example.com" },
  { key: "TEST_VENDOR_PASSWORD", email: "test-vendeur@example.com" },
  { key: "TEST_ADMIN_PASSWORD", email: "test-admin@example.com" },
];

function genPassword() {
  return crypto.randomBytes(18).toString("base64url");
}

function upsertEnv(content, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(content)) return content.replace(re, line);
  const trimmed = content.replace(/\s*$/, "");
  return `${trimmed}\n${line}\n`;
}

const env = fs.readFileSync(ENV_PATH, "utf8");
const dbMatch = env.match(/^DATABASE_URL=(.+)$/m);
if (!dbMatch) {
  console.error("DATABASE_URL introuvable dans .env");
  process.exit(1);
}
const dbUrl = dbMatch[1].trim().replace(/^["']|["']$/g, "");

const sql = neon(dbUrl);
const rows = (r) => (Array.isArray(r) ? r : r.rows || []);

let newEnv = env;
const results = [];

for (const t of TARGETS) {
  const pw = genPassword();
  newEnv = upsertEnv(newEnv, t.key, pw);

  const users = await sql.query(
    'select id from "user" where email = $1',
    [t.email]
  );
  const user = rows(users)[0];
  if (!user) {
    results.push({ email: t.email, key: t.key, ok: false, reason: "compte introuvable" });
    continue;
  }

  const hashed = await hashPassword(pw);
  const updated = await sql.query(
    "update account set password = $1, updated_at = now() where user_id = $2 and provider_id = 'credential'",
    [hashed, user.id]
  );
  const count = updated.affectedRows ?? updated.count ?? rows(updated).length;
  results.push({
    email: t.email,
    key: t.key,
    ok: true,
    passwordLength: pw.length,
    accountRowsUpdated: count,
  });
}

fs.writeFileSync(ENV_PATH, newEnv, "utf8");

for (const r of results) {
  if (r.ok) {
    console.log(`OK ${r.email} -> ${r.key} (${r.passwordLength} car.) lignes account mises a jour: ${r.accountRowsUpdated}`);
  } else {
    console.log(`ECHEC ${r.email} : ${r.reason}`);
  }
}
console.log("Mots de passe ecrits dans .env uniquement. Aucune valeur affichee.");
