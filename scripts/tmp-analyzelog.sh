#!/bin/bash
cd /home/solomon/gaz-point
LOG=.next/dev/logs/next-development.log
echo "=== nombre de lignes ==="
wc -l "$LOG"
echo "=== occurrences d'erreurs ==="
grep -o 'DrizzleQueryError: Failed query: [a-z]* "[a-z_]*"' "$LOG" | sort | uniq -c | sort -r | head -20
echo "=== erreurs de session ==="
grep -c 'Failed to get session' "$LOG"
echo "=== occurrences colonnes GPS ==="
grep -c 'latitude' "$LOG"
echo "=== 5 premières lignes ERROR ==="
grep '"level":"ERROR"' "$LOG" | head -5 | cut -c1-400
