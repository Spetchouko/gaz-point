"use client"

import { useEffect } from "react"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"

export default function DepotError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[dashboard-depot] erreur de rendu:", error)
  }, [error])

  return (
    <div className="space-y-3">
      <h1 className="text-xl font-semibold text-foreground">
        Votre dépôt n&apos;a pas pu s&apos;afficher
      </h1>
      <VendorLoadError
        message="Une erreur est survenue pendant le chargement de votre dépôt."
        detail="Vos données sont intactes. Réessayez ; si le problème persiste, revenez plus tard ou contactez le support."
      />
      <button
        type="button"
        className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
        onClick={reset}
      >
        Réinitialiser cette page
      </button>
    </div>
  )
}
