"use client"

import { useEffect } from "react"

/**
 * Exécute le contenu des balises <template> injectées dans le <head> du layout racine.
 * Les templates ne sont pas exécutés automatiquement par le navigateur ; ce composant
 * les lit et les évalue au montage côté client (après l'hydratation Next.js).
 * Cela permet d'appliquer le thème et la langue sauvegardés dès le chargement
 * sans utiliser de <script> brut dans un composant React.
 */
export default function InitScripts() {
  useEffect(() => {
    for (const id of ["gaz-theme-script", "gaz-lang-script"]) {
      const template = document.getElementById(id) as HTMLTemplateElement | null
      if (!template?.content) continue
      try {
        new Function(template.content.textContent)()
      } catch (e) {
        console.error(`[InitScripts] Échec de l'exécution du template #${id}:`, e)
      }
    }
  }, [])

  return null
}
