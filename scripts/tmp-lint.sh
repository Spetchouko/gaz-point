#!/bin/bash
cd /home/solomon/gaz-point
./node_modules/.bin/eslint \
  app/_components/vendor/vendor-depot-manager.tsx \
  app/_components/format-list-input.tsx \
  app/api/recherche/route.ts \
  "app/api/disponibilite/[id]/route.ts" \
  app/api/depot/mine/route.ts \
  app/api/user/me/route.ts \
  lib/session.ts \
  lib/auth-access.ts \
  lib/transient-retry.ts 2>&1 | tail -40
echo "LINT_EXIT=${PIPESTATUS[0]}"
