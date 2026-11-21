#!/bin/bash
cd /home/solomon/gaz-point
./node_modules/.bin/tsc --noEmit > /tmp/tsc-out.txt 2>&1
echo "total errors: $(wc -l < /tmp/tsc-out.txt)"
echo "=== fichiers modifiés ==="
grep -E "^(lib/session|lib/auth-access|lib/transient-retry|app/api/recherche|app/api/disponibilite/\[id\]|app/api/user/me|app/_components/vendor/vendor-depot-manager)" /tmp/tsc-out.txt || echo "aucune erreur dans les fichiers modifiés"
echo "=== fichiers touchés (comptage global) ==="
cut -d'(' -f1 /tmp/tsc-out.txt | sort | uniq -c | sort -rn | head -20
