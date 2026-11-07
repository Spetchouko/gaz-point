#!/usr/bin/env bash
cd /home/solomon/gaz-point || exit 1
grep -rn "\.png\|\.jpg\|\.svg" app --include=*.ts --include=*.tsx 2>/dev/null | head -20