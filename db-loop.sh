#!/usr/bin/env bash
cd /home/solomon/gaz-point || exit 1
for i in 1 2 3 4 5 6; do
  node -e '
  (async () => {
    const fs = require("fs");
    const { neon } = require("@neondatabase/serverless");
    const env = fs.readFileSync(".env","utf8");
    const m = env.match(/^DATABASE_URL=(.+)$/m);
    const sql = neon(m[1].trim().replace(/^["'"'"']|["'"'"']$/g,""));
    const t = Date.now();
    try {
      const r = await sql.query("select count(*)::int as c from \"user\"");
      console.log("OK", r[0].c, "in", Date.now()-t, "ms");
    } catch (e) {
      console.log("FAIL in", Date.now()-t, "ms:", (e.cause && e.cause.message) || e.message);
    }
  })();
  '
done
