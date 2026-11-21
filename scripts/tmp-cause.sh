#!/bin/bash
cd /home/solomon/gaz-point
LOG=.next/dev/logs/next-development.log
echo "=== première erreur user/session (ligne complète, 1200 car.) ==="
grep -m1 'from \\"user\\"' "$LOG" | cut -c1-1400
echo
echo "=== première erreur session (ligne complète) ==="
grep -m1 'from \\"session\\"' "$LOG" | cut -c1-1400
echo
echo "=== répartition horaire des ERROR ==="
grep '"level":"ERROR"' "$LOG" | grep -o '"timestamp":"[0-9:]*' | cut -d'"' -f4 | cut -c1-5 | sort | uniq -c
