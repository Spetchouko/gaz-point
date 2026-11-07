#!/usr/bin/env bash
# Crée une session de diag, signe le cookie, teste /admin, puis supprime la session.
set -e
cd ~/gaz-point
export PATH=/usr/bin:/home/solomon/.nvm/versions/node/v20.20.2/bin:/home/solomon/.local/share/pnpm/bin:$PATH

OUT=$(node scripts/_diag_session.cjs)
echo "$OUT" | grep -o 'Admin: .*' || true
TOKEN=$(echo "$OUT" | grep -oE 'TOKEN=.*' | cut -d= -f2-)
COOKIE=$(node scripts/_diag_signcookie.cjs "$TOKEN" | sed 's/^COOKIE=//')

echo "=== get-session ==="
curl -s -H "Cookie: $COOKIE" http://localhost:3000/api/auth/get-session | head -c 400
echo
echo "=== GET /admin ==="
curl -s -o /tmp/admin_home.html -w 'status=%{http_code}\n' -H "Cookie: $COOKIE" http://localhost:3000/admin
echo "taille=$(wc -c < /tmp/admin_home.html)"
echo "=== marqueurs ==="
grep -c 'Chargement' /tmp/admin_home.html || true
grep -o 'Tableau de bord' /tmp/admin_home.html | head -1 || true
grep -o '__next_error__' /tmp/admin_home.html | head -1 || true
echo "TOKEN_SAVED=$TOKEN" > /tmp/diag_token.txt
