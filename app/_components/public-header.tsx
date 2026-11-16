"use client"

import { usePathname } from "next/navigation"
import { Header } from "@/app/header"

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

export function PublicHeader() {
  const pathname = usePathname()
  
  // Normalize pathname for comparison
  const normalizedPath = pathname === "/" ? "/" : pathname.replace(/\/$/, "")
  
  const isPublicRoute = PUBLIC_ROUTES.some((route) => {
    const normalizedRoute = route === "/" ? "/" : route.replace(/\/$/, "")
    return normalizedPath === normalizedRoute || normalizedPath.startsWith(normalizedRoute + "/")
  })
  
  // Always show header for root path as fallback
  if (pathname === "/") {
    return <Header />
  }
  
  if (!isPublicRoute) {
    return null
  }
  
  return <Header />
}