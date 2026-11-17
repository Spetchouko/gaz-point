"use client"

import { usePathname } from "next/navigation"
import { Footer } from "@/app/_components/footer"

const PUBLIC_ROUTES = [
  "/",
  "/a-propos",
  "/contact",
  "/services",
  "/devenir-vendeur",
  "/cgu",
  "/cgv",
  "/politique-confidentialite",
  "/politique-cookies",
  "/mentions-legales",
  "/connexion",
  "/inscription",
  "/inscription/usager",
  "/inscription/vendeur",
  "/inscription/vendeur/configuration",
  "/validation-email",
  "/mot-de-passe-oublie",
  "/mot-de-passe-temporaire",
  "/paiement/abonnement",
  "/paiement/echec",
  "/paiement/succes",
]

export function PublicFooter() {
  const pathname = usePathname()
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "")

  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    const normalizedRoute = route === "/" ? "/" : route.replace(/\/$/, "")
    return normalizedPath === normalizedRoute
  })

  if (!isPublicRoute) return null

  return <Footer />
}
