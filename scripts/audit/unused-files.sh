#!/usr/bin/env bash
cd /home/solomon/gaz-point || exit 1
for f in lib/*.ts lib/*.tsx components/*.tsx app/*.tsx app/_components/*.tsx app/_components/*.ts; do
  [ -f "$f" ] || continue
  base=$(basename "$f")
  name="${base%.*}"
  n=$(grep -rl --include="*.ts" --include="*.tsx" -E "from ['\"](@/|\./|\.\./)[^'\"]*/?${name}['\"]" app lib components __tests__ 2>/dev/null | grep -v "^$f$" | wc -l)
  echo "$n $f"
done | sort -n
