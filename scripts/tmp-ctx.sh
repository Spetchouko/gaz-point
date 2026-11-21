#!/bin/bash
cd /home/solomon/gaz-point
LOG=.next/dev/logs/next-development.log
echo "=== contexte large autour des erreurs de re-render (lignes 314-345) ==="
sed -n '310,345p' "$LOG" | cut -c1-300
