#!/usr/bin/env bash
cd /home/solomon/gaz-point || exit 1
for f in drizzle/*.sql; do
  echo "===== $f ====="
  cat "$f"
  echo
done
