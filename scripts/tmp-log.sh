#!/bin/bash
cd /home/solomon/gaz-point
LOG=.next/dev/logs/next-development.log
ls -la "$LOG"
echo "=== taille / dernières 60 lignes ==="
tail -60 "$LOG"
