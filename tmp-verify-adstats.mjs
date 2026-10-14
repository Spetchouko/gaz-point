import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { neon } = require("@neondatabase/serverless");

let url = process.env.DATABASE_URL;
if (!url) {
  const env = fs.readFileSync(".env", "utf8");
  url = env.match(/^DATABASE_URL=(.+)$/m)[1].trim().replace(/^["']|["']$/g, "");
}
const sql = neon(url);

const pub = await sql.query("select count(*)::int as n from publicite");
const zzPub = await sql.query("select count(*)::int as n from publicite where title like 'ZZGEN%' or title like 'ZZTEST%' or title like 'ZZ%'");
const ev = await sql.query("select count(*)::int as n from publicite_event");
const zzEv = await sql.query("select count(*)::int as n from publicite_event where publicite_id like 'ZZ%'");
const bySlot = await sql.query("select slot, status, count(*)::int as n from publicite group by slot, status order by slot");
console.log("PUBLICITE_ROWS:", pub[0].n);
console.log("PUBLICITE_ZZ_LEFTOVERS:", zzPub[0].n);
console.log("EVENT_ROWS:", ev[0].n);
console.log("EVENT_ZZ_LEFTOVERS:", zzEv[0].n);
console.log("PUBLICITE_BY_SLOT:", JSON.stringify(bySlot));
