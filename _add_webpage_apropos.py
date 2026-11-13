#!/usr/bin/env python3
import io

path = "/home/solomon/gaz-point/app/(public)/a-propos/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter l'import de WebPageJsonLd
old_import = 'import { NotrePromesse } from "@/app/_components/notre-promesse"'
new_import = 'import { NotrePromesse } from "@/app/_components/notre-promesse"\nimport { WebPageJsonLd } from "@/app/_components/json-ld"'
content = content.replace(old_import, new_import)

# Ajouter le composant WebPageJsonLd avant le premier <AproposHero />
old_return = '''    <div className="min-h-screen bg-[var(--section-green)] overflow-x-hidden">
      <Fragment>
        <AproposHero />'''
new_return = '''    <div className="min-h-screen bg-[var(--section-green)] overflow-x-hidden">
      <Fragment>
        <WebPageJsonLd
          name="À propos | GazPoints"
          description="GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala et au Cameroun. Profil usager gratuit à vie, espace vendeur à 5 000 FCFA/mois : notre point de départ, nos engagements et la vérification de l'information."
          url="https://www.gazpoints.com/a-propos"
        />
        <AproposHero />'''
content = content.replace(old_return, new_return)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée pour la page À propos")
