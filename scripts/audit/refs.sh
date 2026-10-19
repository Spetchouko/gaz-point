#!/usr/bin/env bash
cd /home/solomon/gaz-point || exit 1
check() {
  label="$1"; pattern="$2"
  echo "== $label"
  grep -rn --include="*.tsx" --include="*.ts" -E "$pattern" app lib components 2>/dev/null | grep -v "^app/_components/$label" | head -5
}
check "admin-profil-with-avatareditor.tsx" "admin-profil-with-avatareditor"
check "admin-statistiques-charts-v2.tsx" "admin-statistiques-charts-v2"
check "admin-statistiques-charts-wrapper.tsx" "admin-statistiques-charts-wrapper\"|admin-statistiques-charts-wrapper'"
check "admin-traffic-charts.tsx" "admin-traffic-charts"
check "admin-vendeur-form.tsx" "admin-vendeur-form"
check "admin-vendor-approvals.tsx" "admin-vendor-approvals"
check "auth-gate-modal.tsx" "auth-gate-modal"
check "pwa-installation.tsx" "pwa-installation"
check "google-auth.tsx" "google-auth"
check "lib/pwa.ts" "@/lib/pwa"
check "lib/site.ts" "@/lib/site"
check "lib/image-utils.ts" "@/lib/image-utils"
check "lib/publicite.ts" "@/lib/publicite\""
check "opengraph-image-mobile" "opengraph-image-mobile"
echo "== admin-statistiques-charts (plain)"
grep -rn "admin-statistiques-charts" --include="*.tsx" app | head -10
echo "== admin-statistiques-charts-wrapper-v2"
grep -rn "admin-statistiques-charts-wrapper-v2" --include="*.tsx" app | head -5
