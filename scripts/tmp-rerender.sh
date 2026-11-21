#!/bin/bash
cd /home/solomon/gaz-point
LOG=.next/dev/logs/next-development.log
echo "=== timestamps des erreurs 'Too many re-renders' ==="
grep -n 'Too many re-renders' "$LOG" | cut -c1-200
echo
echo "=== contexte autour de chaque occurrence (2 lignes avant) ==="
grep -n -B2 'Too many re-renders' "$LOG" | cut -c1-220 | head -40
echo
echo "=== erreurs 'fetch failed' (timestamps) ==="
grep -n 'fetch failed' "$LOG" | cut -c1-260 | head -20
