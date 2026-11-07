/* Vérifie les sessions existantes et le format du token. */
require("dotenv").config();
const { neon } = require("@neondatabase/serverless");

const url = process.env.DATABASE_URL;
const sql = neon(url);

async function main() {
  const cols = await sql`select column_name, data_type from information_schema.columns where table_name = 'session' order by ordinal_position`;
  console.log("session columns:", JSON.stringify(cols));

  const sessions = await sql`select id, token, user_id, expires_at, created_at from "session" order by created_at desc limit 5`;
  console.log("recent sessions:", JSON.stringify(sessions, null, 0));
}

main().then(() => process.exit(0)).catch((e) => { console.error("FATAL", e.message); process.exit(1); });
