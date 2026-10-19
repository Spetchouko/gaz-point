#!/usr/bin/env bash
cd /home/solomon/gaz-point || exit 1
echo "=== tracked suspect files"
git ls-files | grep -E '^(home/|design/|fonts/|tmp-|package-lock|build\.log|tsconfig\.tsbuildinfo|FINAL_REPORT|FIX_SUMMARY|reset-test|apply-migration|check-db|fix-column)' || true
echo "=== untracked"
git status --porcelain --untracked-files=all | head -40
echo "=== node_modules bin check"
ls node_modules/.bin | wc -l
