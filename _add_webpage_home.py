#!/usr/bin/env python3
import io

path = "/home/solomon/gaz-point/app/(public)/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter l'import de WebPageJsonLd
old_import = 'import { errorMessage } from "@/lib/errors"'
new_import = 'import { errorMessage } from "@/lib/errors"\nimport { WebPageJsonLd } from "@/app/_components/json-ld"'
content = content.replace(old_import, new_import)

# Ajouter le composant WebPageJsonLd avant le premier <Hero />
old_return = """    <>
      <Hero searchPublicites={searchPublicites} />"""
new_return = """    <>
      <WebPageJsonLd
        name="GazPoints – Trouvez votre bouteille de gaz au Cameroun"
        description="GazPoints est la plateforme qui vous permet de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente au Cameroun."
        url="https://www.gazpoints.com/"
      />
      <Hero searchPublicites={searchPublicites} />"""
content = content.replace(old_return, new_return)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée pour la page d'accueil")
