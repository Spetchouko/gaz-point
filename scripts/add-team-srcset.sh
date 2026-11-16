#!/usr/bin/env bash
cd /home/solomon/gaz-point || exit 1

file="app/_components/equipe.tsx"

echo "=== Processing $file ==="

# Check current state
echo "--- Before ---"
grep -n "src="/$file | head -10

# Add srcset/sizes to the three team images
# petchImage, henokImage, fabiolaImage

# We need to modify the Image components. Let's check the exact format
sed -i 's|src="/petch.png"|\n              srcset="/petch.png 320w, /petch.png 640w, /petch.png 800w"\n              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 50vw"|g' "$file"
sed -i 's|src="/team/henok.png"|\n              srcset="/team/henok.png 320w, /team/henok.png 640w, /team/henok.png 800w"\n              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 50vw"|g' "$file"
sed -i 's|src="/team/Fabiola.png"|\n              srcset="/team/Fabiola.png 320w, /team/Fabiola.png 640w, /team/Fabiola.png 800w"\n              sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 50vw"|g' "$file"

echo "--- After ---"
grep -n 'srcset=' "$file" | head -10

echo "=== Done ==="