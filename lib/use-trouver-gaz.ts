"use client"

import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"

/**
 * Gestionnaire des actions « Trouver du gaz ».
 * - Utilisateur connecté : défile vers la section de recherche (#trouver-du-gaz).
 * - Visiteur non connecté : redirige vers l'inscription (parcours existant).
 *
 * `destination` permet de viser /connexion pour les actions où un compte
 * est plus probablement déjà existant.
 */
export function useTrouverGaz(destination = "/inscription") {
  const router = useRouter()
  const { data: session, isPending } = authClient.useSession()

  return () => {
    if (isPending) return
    if (!session?.user) {
      router.push(destination)
      return
    }
    const el = document.getElementById("trouver-du-gaz")
    if (el) {
      el.scrollIntoView({ behavior: "smooth" })
    } else {
      // Hors landing (bouton flottant présent sur toutes les pages) :
      // on ramène l'utilisateur connecté vers la section de recherche.
      router.push("/#trouver-du-gaz")
    }
  }
}
