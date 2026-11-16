#!/bin/bash
cd /home/solomon/gaz-point

# Trouver tous les fichiers .tsx sauf dashboard et composants/ui
FILES=$(find app -name "*.tsx" | grep -v "app/dashboard" | grep -v "components/ui" | grep -v "app/locales")

for f in $FILES; do
  # Remplacements de "tu" → "vous" (avec espaces pour éviter les faux positifs)
  sed -i 's/\bTu es /\bVous êtes /g' "$f"
  sed -i 's/\bTu as /\bVous avez /g' "$f"
  sed -i "s/\bTu n'\''as /\bVous n'\''avez pas /g" "$f"
  sed -i 's/\bTu sais /\bVous savez /g' "$f"
  sed -i 's/\bTu cherches /\bVous cherchez /g' "$f"
  sed -i 's/\bTu trouves /\bVous trouvez /g' "$f"
  sed -i 's/\bTu vois /\bVous voyez /g' "$f"
  sed -i 's/\bTu vas /\bVous allez /g' "$f"
  sed -i 's/\bTu peux /\bVous pouvez /g' "$f"
  sed -i 's/\bTu veux /\bVous voulez /g' "$f"
  sed -i 's/\bTu décides /\bVous décidez /g' "$f"
  sed -i 's/\bTu gagnes /\bVous gagnez /g' "$f"
  sed -i 's/\bTu économises /\bVous économisez /g' "$f"
  sed -i 's/\bTon /\bVotre /g' "$f"
  sed -i 's/\bton /\bvotre /g' "$f"
  sed -i 's/\bTa /\bVotre /g' "$f"
  sed -i 's/\bta /\bvotre /g' "$f"
  sed -i 's/\bTes /\bVos /g' "$f"
  sed -i 's/\stes /\bes /g' "$f"
  sed -i 's/\bte /vous /g' "$f"
done

echo "Remplacements terminés"
