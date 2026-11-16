#!/usr/bin/env python3
import io

path = "/home/solomon/gaz-point/app/(public)/contact/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter l'import de WebPageJsonLd
old_import = '''import { ContactVendeurs } from "@/app/_components/contact-vendeurs"'''
new_import = '''import { ContactVendeurs } from "@/app/_components/contact-vendeurs"
import { WebPageJsonLd } from "@/app/_components/json-ld"'''
content = content.replace(old_import, new_import)

# Ajouter le composant WebPageJsonLd avant <ContactHero />
old_return = '''      <ContactHero />
      <SoftSeparator />
      <ContactCanaux />'''
new_return = '''      <WebPageJsonLd
        name="Contact | GazPoints"
        description="Écrivez à GazPoints : email, téléphone, WhatsApp et adresse à Douala. Signalez une information fausse, un point de vente manquant, ou rejoignez GazPoints en tant que vendeur (5 000 FCFA/mois)."
        url="https://www.gazpoints.com/contact"
      />
      <ContactHero />
      <SoftSeparator />
      <ContactCanaux />'''
content = content.replace(old_return, new_return)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée")
