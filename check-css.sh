#!/bin/bash
cd /home/solomon/gaz-point
for f in .next/static/chunks/*.css; do
  echo "== $f"
  grep -o -e "--color-[a-z-]*: *#[a-f0-9]*" "$f" | sort -u
  echo "--- utilitaires ---"
  grep -o -e "bg-primary" -e "text-foreground" -e "bg-mint" -e "bg-sky" -e "bg-sand" -e "font-heading" -e "bg-gradient-section" "$f" | sort | uniq -c
done
