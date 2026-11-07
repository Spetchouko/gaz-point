import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { neon } = require("@neondatabase/serverless");

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const file = process.argv[2] || "drizzle/0007_brand.sql";
const sqlPath = path.isAbsolute(file) ? file : path.join(ROOT, file);

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

const content = fs.readFileSync(sqlPath, "utf8");
const statements = content
  .split(/;\s*\n/)
  .map((s) => s.replace(/--[^\n]*\n/g, "").trim())
  .filter(Boolean);

const sql = neon(dbUrl);
for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.split("\n")[0].slice(0, 70));
}
console.log(`Migration appliquée (${statements.length} instructions) : ${file}`);
