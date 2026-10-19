#!/usr/bin/env bash
BASE="http://localhost:3000"
JAR=/tmp/audit-cookies.txt
for i in $(seq 1 10); do
  c=$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' --max-time 30 "$BASE/admin")
  echo "attempt $i: /admin -> $c"
done
echo "--- statistiques ---"
for i in $(seq 1 5); do
  c=$(curl -s -b "$JAR" -o /dev/null -w '%{http_code}' --max-time 30 "$BASE/admin/statistiques")
  echo "attempt $i: /admin/statistiques -> $c"
done
