#!/usr/bin/env python3
import io

path = "/home/solomon/gaz-point/app/(public)/devenir-vendeur/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    lines = f.readlines()

# Trouver la ligne avec <div className="min-h-screen bg-background">
div_open_line = None
for i, line in enumerate(lines):
    if '<div className="min-h-screen bg-background">' in line:
        div_open_line = i
        break

if div_open_line is None:
    print("Erreur : div min-h-screen bg-background non trouvé")
    exit(1)

# Trouver la ligne avec </div> qui ferme ce div (le dernier </div> avant le </section> qui ferme la section principale)
# On cherche le dernier </div> avant le </section> qui est avant le </>
div_close_line = None
section_close_line = None
fragment_close_line = None

for i in range(div_open_line, len(lines)):
    if '</section>' in lines[i]:
        section_close_line = i
    if '</div>' in lines[i]:
        div_close_line = i
    if '</>' in lines[i]:
        fragment_close_line = i

print(f"div_open_line: {div_open_line + 1}")
print(f"div_close_line: {div_close_line + 1 if div_close_line else None}")
print(f"section_close_line: {section_close_line + 1 if section_close_line else None}")
print(f"fragment_close_line: {fragment_close_line + 1 if fragment_close_line else None}")

# Le problème est probablement que le </div> à la ligne div_close_line ferme un div interne,
# pas le div principal. Ou alors le </section> à la ligne section_close_line ferme une section
# qui n'est pas à l'intérieur du div.

# Solution : supprimer le fragment <> et </> et remettre le fichier dans son état original,
# puis ajouter WebPageJsonLd à l'intérieur du div.

# Pour simplifier, on va supprimer le fragment et remettre les balises originales.
# On remplace <> par <div className="min-h-screen bg-background"> et </> par </div>
# Mais comme le div est déjà ouvert à la ligne div_open_line, on doit supprimer le <>
# et le </> et garder le div tel quel.

# En fait, le problème est que le fragment a été ajouté autour du div existant,
# mais le div avait déjà ses propres balises d'ouverture et de fermeture.
# On doit supprimer le fragment et garder le div tel quel.

# Supprimer la ligne avec <>
content = lines
content[28] = content[28].replace('<>\n', '') if '<>\n' in content[28] else content[28]
# En fait, la ligne 28 est "  return (\n" et la ligne 29 est "    <>\n"
# On doit remplacer la ligne 29 par rien (supprimer le <>)
# Et remplacer la ligne avec </> par rien

# Trouver la ligne avec </>
frag_close_idx = None
for i, line in enumerate(content):
    if line.strip() == '</>':
        frag_close_idx = i
        break

if frag_close_idx is not None:
    content.pop(frag_close_idx)

# Supprimer la ligne avec <>
frag_open_idx = None
for i, line in enumerate(content):
    if line.strip() == '<>':
        frag_open_idx = i
        break

if frag_open_idx is not None:
    content.pop(frag_open_idx)

with io.open(path, "w", encoding="utf-8") as f:
    f.writelines(content)

print("Fichier corrigé")
