require("dotenv/config");
const { neon } = require("@neondatabase/serverless");

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.log("DATABASE_URL missing");
    process.exit(1);
  }
  const sql = neon(url);

  try {
    const users = await sql`SELECT id, name, email, role, email_verified, is_active, must_change_password, approval_status FROM "user" ORDER BY created_at DESC LIMIT 50;`;
    console.log("USERS_FOUND:", users.length);
    for (const u of users) {
      console.log(`  - ${u.email} | role: ${u.role} | verified: ${u.email_verified} | active: ${u.is_active} | name: ${u.name}`);
    }
  } catch (e) {
    console.error("ERROR listing users:", e.message);
  }

  try {
    const sessions = await sql`SELECT COUNT(*) as cnt FROM "session";`;
    console.log("SESSIONS_COUNT:", sessions[0].cnt);
  } catch (e) {
    console.error("ERROR listing sessions:", e.message);
  }

  process.exit(0);
}
main().catch((e) => {
  console.error("FATAL", e.message);
  process.exit(1);
});
