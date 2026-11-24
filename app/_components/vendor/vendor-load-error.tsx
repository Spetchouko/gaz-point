"use client"

import { useRouter } from "next/navigation"
import { VendorErrorState } from "@/app/_components/vendor/vendor-ui"

/**
 * État d'erreur de chargement côté vendeur.
 *
 * Le message est volontairement contextuel et générique : la cause technique
 * reste dans les logs serveur (console.error), jamais dans le HTML envoyé au
 * navigateur. Le bouton relance le rendu serveur de la page concernée.
 */
export function VendorLoadError({
  message,
  detail,
}: {
  message: string
  detail?: string
}) {
  const router = useRouter()

  return (
    <div className="space-y-2" role="status">
      <VendorErrorState message={message} onRetry={() => router.refresh()} />
      {detail && <p className="text-xs text-muted-foreground">{detail}</p>}
    </div>
  )
}
