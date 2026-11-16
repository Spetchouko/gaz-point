#!/usr/bin/env python3
import io

# Modifier services/page.tsx
path = "/home/solomon/gaz-point/app/(public)/services/page.tsx"
with io.open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Ajouter l'import de WebPageJsonLd
old_import = "export const metadata: Metadata = {"
new_import = 'import { WebPageJsonLd } from "@/app/_components/json-ld"\n\nexport const metadata: Metadata = {'
content = content.replace(old_import, new_import)

# Ajouter le composant WebPageJsonLd avant le premier élément JSX
old_start = '''export default function Services() {
  return (
    <section className="py-12 max-w-md mx-auto">'''
new_start = '''export default function Services() {
  return (
    <>
      <WebPageJsonLd
        name="Nos services | GazPoints"
        description="Informations sur les services GazPoints : abonnement usager gratuit, espace vendeur, support technique, et FAQ. Trouvez votre bouteille de gaz au Cameroun."
        url="https://www.gazpoints.com/services"
      />
      <section className="py-12 max-w-md mx-auto">'''
content = content.replace(old_start, new_start)

# Fermer le fragment à la fin
old_end = '''      </section>
  )
}'''
new_end = '''      </section>
    </>
  )
}'''
content = content.replace(old_end, new_end)

with io.open(path, "w", encoding="utf-8") as f:
    f.write(content)

print("Modification terminée pour la page Services")
