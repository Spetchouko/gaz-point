/* Crée une session de test temporaire pour l'utilisateur admin (supprimée ensuite). */
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");
const crypto = require("crypto");

const url = process.env.DATABASE_URL;
const sql = neon(url);

async function main() {
  const admins = await sql`select id, name, email, role from "user" where role = 'admin' limit 1`;
  if (!admins.length) { console.error("AUCUN ADMIN"); process.exit(1); }
  const admin = admins[0];
  console.log("Admin:", admin.email);

  const token = "diag-test-session-" + crypto.randomBytes(24).toString("hex");
  const expires = new Date(Date.now() + 7 * 24 * 3600 * 1000);
  const now = new Date();
  await sql`insert into "session" ("id", "expires_at", "token", "created_at", "updated_at", "ip_address", "user_agent", "user_id") values (${crypto.randomUUID()}, ${expires.toISOString()}, ${token}, ${now.toISOString()}, ${now.toISOString()}, '127.0.0.1', 'diag-curl', ${admin.id})`;
  console.log("TOKEN=" + token);
}

main().then(() => process.exit(0)).catch((e) => { console.error("FATAL", e.message); process.exit(1); });
