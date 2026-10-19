#!/usr/bin/env bash
cd /home/solomon/gaz-point || exit 1

files=(
  "app/_components/apropos-hero.tsx"
  "app/_components/footer.tsx"
  "app/_components/demonstration.tsx"
  "app/header.tsx"
  "app/(auth)/connexion/page.tsx"
  "app/(auth)/mot-de-passe-oublie/page.tsx"
)

for file in "${files[@]}"; do
  echo "=== Processing $file ==="
  if grep -q "srcset=" "$file" 2>/dev/null; then
    echo "  Already has srcset, skipping"
  else
    sed -i 's|<Image\n              src="/brand/logo.png"\n              alt=""\n              width={192}\n              height={192}\n              className="h-full w-full object-contain" />|<Image\n              src="/brand/logo.png"\n              alt=""\n              width={192}\n              height={192}\n              srcset="/brand/logo.png 320w, /brand/logo.png 640w, /brand/logo.png 1200w"\n              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 50vw"\n              className="h-full w-full object-contain" />|g' "$file"
    echo "  Added srcset/sizes"
  fi
done

echo "=== Done ==="