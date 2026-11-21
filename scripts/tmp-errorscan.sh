#!/bin/bash
cd /home/solomon/gaz-point
LOG=.next/dev/logs/next-development.log
echo "=== mots-clés d'erreur réseau/quotas ==="
for k in "fetch failed" "429" "ECONN" "ETIMEDOUT" "rate" "Too Many" "socket" "UND_ERR" "getaddrinfo" "column" "does not exist" "syntax error"; do
  c=$(grep -ic "$k" "$LOG")
  echo "$k : $c"
done
echo
echo "=== requêtes en échec (table cible) ==="
grep -o 'from \\"[a-z_]*\\"' "$LOG" | sort | uniq -c | sort -r
echo
echo "=== messages uniques des ERROR (extrait 160 car.) ==="
grep '"level":"ERROR"' "$LOG" | grep -o '"message":"[^"]\{0,160\}' | sed 's/"message":"//' | sort | uniq -c | sort -r | head -25
