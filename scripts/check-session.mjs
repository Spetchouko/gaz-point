import { neon } from "@neondatabase/serverless";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
function envValue(key) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const DB_URL = envValue("DATABASE_URL");
const sql = neon(DB_URL);

async function main() {
  // Check sessions table
  const sessions = await sql`SELECT id, user_id, expires_at, token FROM session WHERE token LIKE 'as8j6Na1P8S3GqSkOBQPEC6KOzp2CdZg%'`;
  console.log("Sessions:", sessions);
}

main().catch(console.error);