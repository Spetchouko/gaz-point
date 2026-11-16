#!/bin/bash
echo "=== Files in _components ==="
ls /home/solomon/gaz-point/app/_components/ 2>&1
echo ""
echo "=== Search for admin-traffic references ==="
grep -rn "admin-traffic" /home/solomon/gaz-point/ --include="*.ts" --include="*.tsx" 2>/dev/null | head -20
echo ""
echo "=== Check git log ==="
cd /home/solomon/gaz-point && git log --oneline --all -- "app/_components/admin-traffic-charts*" 2>/dev/null | head -10
