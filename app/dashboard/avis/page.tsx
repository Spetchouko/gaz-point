import { redirect } from "next/navigation"
import { MonAvis } from "@/app/_components/dashboard/mon-avis"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"
import { VendorReviewManager } from "@/app/_components/vendor/vendor-review-manager"
import { avisTypeFromRole } from "@/lib/avis-shared"
import { getRoleDashboardPath, isAuthRole } from "@/lib/auth-routing"
import { getCurrentUser } from "@/lib/session"
import { getVendorReview } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

/** Charge l'avis vendeur hors du rendu JSX pour isoler les erreurs de données. */
async function loadVendorReview(userId: string) {
  return getVendorReview(userId)
}

/** Espace « Donner mon avis », réservé aux clients et aux vendeurs. */
export default async function AvisPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/connexion")

  if (user.role === "vendor") {
    let review: Awaited<ReturnType<typeof loadVendorReview>>
    try {
      review = await loadVendorReview(user.id)
    } catch (err) {
      console.error("[avis/vendeur] Chargement impossible:", err)
      return (
        <VendorLoadError
          message="Impossible de charger votre avis."
          detail="Vos données sont intactes. Réessayez dans un instant."
        />
      )
    }
    return <VendorReviewManager initialReview={review} />
  }

  if (user.role !== "client") {
    redirect(isAuthRole(user.role) ? getRoleDashboardPath(user.role) : "/")
  }

  return <MonAvis role={avisTypeFromRole(user.role)} />
}
