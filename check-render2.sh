#!/bin/bash
cd /home/solomon/gaz-point
OUT=/home/solomon/home-check.html
curl -s http://localhost:3000/ -o "$OUT"
echo "=== occurrences 'Trouver du gaz' ==="
grep -o "Trouver du gaz" "$OUT" | wc -l
echo "=== ordre des sections (id + first h1/h2/h3) ==="
grep -o -e 'id="accueil"' -e 'id="trouver-du-gaz"' -e 'class="[^"]*bg-sand[^"]*"' -e 'id="comment-ca-marche"' -e 'id="faq"' "$OUT" | head -10
echo "=== titres dans l'ordre ==="
grep -o -e "<h1[^>]*>[^<]*" -e "<h2[^>]*>[^<]*" "$OUT" | head -12
echo "=== texte hero (300 premiers chars apres le h1) ==="
python3 - "$OUT" <<'EOF'
import sys, re
html = open(sys.argv[1], encoding="utf-8").read()
# extraire le texte visible des 4000 premiers caractères après id="accueil"
start = html.find('id="accueil"')
chunk = html[start:start+8000]
text = re.sub(r'<script[^>]*>.*?</script>', '', chunk, flags=re.S)
text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.S)
text = re.sub(r'<[^>]+>', ' ', text)
text = re.sub(r'\s+', ' ', text)
print(text[:1200])
EOF
rm -f "$OUT"
