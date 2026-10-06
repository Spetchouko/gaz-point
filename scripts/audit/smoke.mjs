import * as lib from "./lib.mjs";

const ids = lib.loadActionIds();
console.log("ACTIONS:", JSON.stringify(ids, null, 1));

const fd = new FormData();
fd.append("pointId", "x");
const enc = await lib.encodeReply([null, fd]);
console.log("encodeReply type:", enc?.constructor?.name, "entries:", typeof enc?.keys === "function" ? [...enc.keys()].slice(0, 8) : String(enc).slice(0, 80));

const s = await lib.signIn(lib.TEST_USER_EMAIL, lib.TEST_USER_PASSWORD);
console.log("signIn:", s.status, "cookie:", s.cookie ? "oui" : "non", "email:", s.body?.user?.email, "role:", s.body?.user?.role);

const sess = await lib.getSession(s.cookie);
console.log("session:", sess.status, "email:", sess.body?.user?.email, "role:", sess.body?.user?.role);

const noAuth = await lib.getPage("/dashboard/pro", null);
console.log("no-auth /dashboard/pro:", noAuth.status, "->", noAuth.location);

const userPro = await lib.getPage("/dashboard/pro", s.cookie);
console.log("user /dashboard/pro:", userPro.status, "->", userPro.location);

const v = await lib.signIn(lib.TEST_VENDOR_EMAIL, lib.TEST_VENDOR_PASSWORD);
console.log("vendor signIn:", v.status, "cookie:", v.cookie ? "oui" : "non");

const point = await lib.db("select id, name from point_de_vente where name = 'Bocom Deïdo'");
console.log("point:", point[0]?.name, point[0]?.id);

const fd2 = new FormData();
fd2.append("pointId", point[0].id);
fd2.append("status", "disponible");
fd2.append("note", "Smoke test audit");
const ids2 = lib.loadActionIds();
const r = await lib.callAction(v.cookie, ids2.reportDisponibilite, [null, fd2]);
console.log("action status:", r.status, "notFound:", r.notFound, "redirect:", r.redirect);
console.log("action result:", JSON.stringify(r.result));
console.log("action text head:", r.text.slice(0, 400).replace(/\n/g, " | "));
