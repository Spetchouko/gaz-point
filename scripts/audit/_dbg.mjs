import * as lib from "./lib.mjs";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

const server = path.join(lib.ROOT, ".next", "server");
const files = [];
async function walk(dir) {
  for (const e of await fsp.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) await walk(p);
    else if (e.name === "server-reference-manifest.json") files.push(p);
  }
}
await walk(server);
const by = {};
const gf = path.join(server, "server-reference-manifest.json");
for (const file of files.filter((f) => f === gf).concat(files.filter((f) => f !== gf))) {
  for (const [id, entry] of Object.entries(JSON.parse(fs.readFileSync(file, "utf8")).node || {})) {
    if (entry?.exportedName) by[entry.exportedName] = id;
  }
}

const admin = await lib.signIn(lib.TEST_ADMIN_EMAIL, lib.TEST_ADMIN_PASSWORD);
const adminRow = await lib.dbOne(`select id, name from "user" where email = $1`, [lib.TEST_ADMIN_EMAIL]);
const point = await lib.dbOne(`select id, name from point_de_vente order by created_at asc limit 1`);
const fd = new FormData();
fd.append("pointName", point.name);
fd.append("format", "6 kg");
fd.append("status", "disponible");
fd.append("brand", "Total");
fd.append("note", "Itinéraire facile");
const r = await lib.callAction(admin.cookie, by.createDisponibiliteAdmin, [null, fd], "/admin/disponibilites");
console.log("create", JSON.stringify(r.result));
const row = await lib.dbOne(`select id, source, reported_by, reported_by_name, status from disponibilite where brand='Total' order by created_at desc limit 1`);
console.log("row", JSON.stringify(row));
console.log("adminRow", JSON.stringify(adminRow));
await lib.db(`delete from disponibilite where id = $1`, [row.id]);
await lib.db(`delete from brand where name_key in ('total')`);