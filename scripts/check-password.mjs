import { neon } from "@neondatabase/serverless";
import fs from "fs";

const env = fs.readFileSync(".env", "utf8");
function envValue(key) {
  const m = env.match(new RegExp(`^${key}=(.*)$`, "m"));
  if (!m) return null;
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const DB_URL = envValue("DATABASE_URL");
console.log("DB_URL:", DB_URL ? "loaded" : "not loaded");

const sql = neon(DB_URL);

async function main() {
  // Check if user exists
  const userResult = await sql`SELECT id, email, role FROM "user" WHERE email = 'test-vendeur@example.com'`;
  console.log("User:", userResult);
  
  if (userResult.length > 0) {
    const userId = userResult[0].id;
    const accountResult = await sql`SELECT user_id, password FROM account WHERE provider_id = 'credential' AND user_id = ${userId}`;
    console.log("Account:", accountResult);
  }
}

main().catch(console.error);