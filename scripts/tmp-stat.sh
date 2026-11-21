#!/bin/bash
cd /home/solomon/gaz-point
stat -c '%y  %n' db/schema.ts \
  app/api/depot/create/route.ts \
  'app/api/depot/[id]/route.ts' \
  app/api/recherche/route.ts \
  lib/vendor-dashboard.ts \
  app/_components/vendor/vendor-depot-manager.tsx \
  .next/dev 2>/dev/null
echo "--- .next/cache ---"
ls -la .next/cache 2>/dev/null | head -20
echo "--- dernières modifications sous .next/dev (top 10) ---"
find .next/dev -newermt '-12 hours' -type f -printf '%T+ %p\n' 2>/dev/null | sort -r | head -10
