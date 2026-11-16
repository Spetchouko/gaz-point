#!/bin/bash
cd /home/solomon/gaz-point

# 1. Remove unused Tabs import from admin-client-detail.tsx
grep -v 'Tabs' app/_components/admin-client-detail.tsx > app/_components/admin-client-detail.tmp && mv app/_components/admin-client-detail.tmp app/_components/admin-client-detail.tsx

# 2. Fix unescaped apostrophe "administration" -> "administration" in admin-client-detail.tsx
sed -i 's/administration/administration/' app/_components/admin-client-detail.tsx

# 3. Remove notInArray from clients page imports
sed -i 's/, notInArray//' 'app/admin/(protected)/clients/page.tsx'

# 4. Remove unused statusColor in admin-clients-table.tsx  
grep -v 'statusColor' app/_components/admin-clients-table.tsx > app/_components/admin-clients-table.tmp && mv app/_components/admin-clients-table.tmp app/_components/admin-clients-table.tsx

echo "All lint fixes applied."
