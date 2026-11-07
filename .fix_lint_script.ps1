$ErrorActionPreference = "Stop"
$fixScript = @'
#!/bin/bash
cd /home/solomon/gaz-point

# Fix 1: Remove notInArray from clients page imports
sed -i 's/, notInArray//' "app/admin/(protected)/clients/page.tsx"

# Fix 2: Remove statusColor const from clients table
sed -i '/^const statusColor/,/^}/d' app/_components/admin-clients-table.tsx

# Fix 3: Remove currentUserId prop from clients table destructuring
sed -i 's/currentUserId,$//' app/_components/admin-clients-table.tsx

echo "Lint fixes applied."
'@
Set-Content -Path "/home/solomon/.temp/fix_lint.sh" -Value $fixScript -Encoding UTF8
wsl bash -c 'cd /home/solomon && sed -i "s/, notInArray//" "app/admin/(protected)/clients/page.tsx" && sed -i "/^const statusColor/,/^}/d" "app/_components/admin-clients-table.tsx" && sed -i "s/currentUserId,$//" "app/_components/admin-clients-table.tsx" && echo "done"'