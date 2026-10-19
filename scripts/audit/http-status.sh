#!/usr/bin/env bash
BASE="${BASE:-http://localhost:3000}"
PATHS="/ /a-propos /services /contact /avis /cgu /cgv /mentions-legales /politique-confidentialite /politique-cookies /connexion /inscription /inscription/usager /inscription/vendeur /mot-de-passe-oublie /validation-email /dashboard /dashboard/pro /dashboard/vendeur /admin /admin/login /profil /mes-favoris /mes-commandes /dashboard/reservations /api/recherche"
for p in $PATHS; do
  out=$(curl -s -o /dev/null -w "%{http_code} %{redirect_url}" "$BASE$p")
  echo "$out  $p"
done
