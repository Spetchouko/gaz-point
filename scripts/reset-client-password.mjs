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

// ---- Arguments ----
const email = (argValue("--email") || "").trim().toLowerCase();
const forceChange = args.includes("--force-change");
const passwordFile = argValue("--password-file");

if (!email) {
  console.error("Usage: node scripts/reset-client-password.mjs --email <email-client> [--force-change] [--password-file <fichier>]");
  process.exit(1);
}

// ---- DATABASE_URL ----
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

let password = process.env.RESET_CLIENT_PASSWORD;
if (!password && passwordFile) {
  password = fs.readFileSync(passwordFile, "utf8").replace(/\r?\n$/, "");
}
if (!password) {
  // Génère un mot de passe temporaire robuste et aléatoire (24 caractères)
  password = crypto.randomBytes(18).toString("base64url");
  console.log("Aucun mot de passe fourni : génération automatique d'un mot de passe temporaire.");
}

if (password.length < 8) {
  console.error("Mot de passe trop court (>= 8 caractères).");
  process.exit(1);
}

const sql = neon(dbUrl);
const rows = (r) => (Array.isArray(r) ? r : r.rows || []);

console.log(`=== Réinitialisation du mot de passe client : ${email} ===`);

// ---- 1. Identifier le compte client existant ----
const users = rows(
  await sql.query(
    `select id, name, email, role, email_verified, is_active, must_change_password from "user" where email = $1`,
    [email]
  )
);

if (!users[0]) {
  console.error(`Aucun compte trouvé avec l'email : ${email}`);
  process.exit(1);
}

const user = users[0];
console.log(`Compte trouvé : id=${user.id}, nom=${user.name}, email=${user.email}, rôle=${user.role}, actif=${user.is_active}, email vérifié=${user.email_verified}`);

if (user.role !== "client") {
  console.error(`Ce compte a le rôle "${user.role}", pas "client". Opération annulée.`);
  process.exit(1);
}

// ---- 2. Hacher le mot de passe ----
const hashed = await hashPassword(password);

// ---- 3. Mettre à jour la table "user" (optionnel: forcer le changement) ----
let updateSql = `update "user" set updated_at = now()`;
const updateParams: unknown[] = [];

if (forceChange) {
  updateSql += `, must_change_password = true`;
  console.log("Le changement de mot de passe sera imposé à la prochaine connexion.");
}

updateSql += ` where id = $${updateParams.length + 1}`;
updateParams.push(user.id);

await sql.query(updateSql, updateParams);

// ---- 4. Mettre à jour / créer le hash dans la table "account" ----
const cred = rows(
  await sql.query(
    `select id from "account" where user_id = $1 and provider_id = 'credential'`,
    [user.id]
  )
);

if (cred[0]) {
  await sql.query(
    `update "account" set password = $1, updated_at = now() where id = $2`,
    [hashed, cred[0].id]
  );
  console.log("Hash de mot de passe mis à jour dans la table 'account'.");
} else {
  const id = crypto.randomBytes(16).toString("hex");
  await sql.query(
    `insert into "account" (id, account_id, provider_id, user_id, password, created_at, updated_at) values ($1, $2, 'credential', $3, $4, now(), now())`,
    [id, email, user.id, hashed]
  );
  console.log("Nouveau hash de mot de passe créé dans la table 'account'.");
}

// ---- 5. Vérification ----
const check = rows(
  await sql.query(
    `select email, role, must_change_password, updated_at from "user" where email = $1`,
    [email]
  )
);
console.log("\n=== RÉSULTAT ===");
console.log(JSON.stringify(check, null, 2));

console.log(`\nLe mot de passe du compte client "${email}" a été réinitialisé avec succès.`);
console.log(`Nouveau mot de passe temporaire : ${password}`);
console.log(`Page de connexion : /connexion`);
if (forceChange) {
  console.log("Le changement de mot de passe sera imposé à la première connexion.");
}
