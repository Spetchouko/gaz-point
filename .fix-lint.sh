#!/bin/bash
cd /home/solomon/gaz-point
# Remove unused Tabs import from admin-client-detail.tsx
sed -i '/from ".*tabs"/d' app/_components/admin-client-detail.tsx
# Fix unescaped apostrophe in admin-client-detail.tsx
sed -i 's/d\'administration/d&apos;administration/' app/_components/admin-client-detail.tsx
# Remove notInArray from clients page imports
sed -i 's/, notInArray//' app/admin/\(protected\)/clients/page.tsx
echo "Lint fixes applied."