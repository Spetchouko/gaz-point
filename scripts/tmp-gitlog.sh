#!/bin/bash
cd /home/solomon/gaz-point
echo "=== 8 derniers commits ==="
git log -8 --format='%h | %ad | %s' --date=format:'%Y-%m-%d %H:%M'
echo "=== dernier commit touchant db/schema.ts ==="
git log -3 --format='%h | %ad | %s' --date=format:'%Y-%m-%d %H:%M' -- db/schema.ts
echo "=== dernier commit touchant lib/vendor-dashboard.ts ==="
git log -3 --format='%h | %ad | %s' --date=format:'%Y-%m-%d %H:%M' -- lib/vendor-dashboard.ts
echo "=== BUILD_ID / timestamp .next ==="
cat .next/BUILD_ID 2>/dev/null || echo "pas de BUILD_ID"
stat -c '%y %n' .next 2>/dev/null
stat -c '%y %n' .next/BUILD_ID 2>/dev/null
