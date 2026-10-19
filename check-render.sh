#!/bin/bash
cd /home/solomon/gaz-point
OUT=/home/solomon/home-check.html
curl -s http://localhost:3000/ -o "$OUT"
echo "size: $(wc -c < "$OUT")"
echo "--- ancres ---"
grep -o 'id="accueil"' "$OUT"
grep -o 'id="trouver-du-gaz"' "$OUT"
grep -o 'id="comment-ca-marche"' "$OUT"
grep -o 'id="faq"' "$OUT"
echo "--- boutons recherche ---"
grep -c "Trouver du gaz" "$OUT"
echo "--- contenu demonstration (doit etre 0) ---"
grep -c "Aperçu · Démo" "$OUT" || true
echo "--- css link ---"
grep -o 'href="[^"]*\.css"' "$OUT" | head -3
rm -f "$OUT"
