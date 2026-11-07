#!/usr/bin/env bash
BASE="http://localhost:3001"
JAR=/tmp/audit-cookies-3001.txt
rm -f "$JAR"

echo "== sign-in =="
curl -s -c "$JAR" -H 'Content-Type: application/json' -X POST "$BASE/api/auth/sign-in/email" \
  -d '{"email":"audit-temp-admin@example.com","password":"AuditTemp!2026"}' \
  -o /dev/null -w 'signin http=%{http_code}\n'

echo "== /admin x8 (port 3001) =="
for i in $(seq 1 8); do
  c=$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' --max-time 40 "$BASE/admin")
  echo "attempt $i -> $c"
done
