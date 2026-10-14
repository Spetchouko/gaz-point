import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { neon } = require("@neondatabase/serverless");

let url = process.env.DATABASE_URL;
if (!url) {
  const env = fs.readFileSync(".env", "utf8");
  url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
}
const at = url.lastIndexOf("@");
console.log("DB_HOST:", at >= 0 ? url.slice(at + 1).split("/")[0] : "(unknown)");

const sql = neon(url);

const pub = await sql.query("select count(*)::int n from publicite");
console.log("PUBLICITE_COUNT:", pub[0].n);

const cols = await sql.query(
  "select column_name, data_type, is_nullable, column_default from information_schema.columns where table_name='publicite' order by ordinal_position"
);
console.log("PUBLICITE_COLUMNS:", JSON.stringify(cols));

const actions = await sql.query(
  "select id, admin_id, target_type, target_id, action, details, created_at from admin_action where target_type='publicite' order by created_at desc limit 40"
);
console.log("PUBLICITE_ACTIONS:", JSON.stringify(actions, null, 2));

const anyPub = await sql.query(
  "select id, target_type, target_id, action, details, created_at from admin_action where details ilike '%publicit%' order by created_at desc limit 40"
);
console.log("ANY_PUBLICITE_ACTIONS:", JSON.stringify(anyPub, null, 2));

const recent = await sql.query(
  "select target_type, action, details, created_at from admin_action order by created_at desc limit 15"
);
console.log("RECENT_ADMIN_ACTIONS:", JSON.stringify(recent, null, 2));
