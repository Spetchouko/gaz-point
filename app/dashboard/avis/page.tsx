import { redirect } from "next/navigation"
import { MonAvis } from "@/app/_components/dashboard/mon-avis"
import { VendorReviewManager } from "@/app/_components/vendor/vendor-review-manager"
import { avisTypeFromRole } from "@/lib/avis-shared"
import { getRoleDashboardPath, isAuthRole } from "@/lib/auth-routing"
import { getCurrentUser } from "@/lib/session"
import { getVendorReview } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

/** Espace « Donner mon avis », réservé aux clients et aux vendeurs. */
export default async function AvisPage() {
  const user = await getCurrentUser()
  if (!user) redirect("/connexion")

  if (user.role === "vendor") {
    const review = await getVendorReview(user.id)
    return <VendorReviewManager initialReview={review} />
  }

  if (user.role !== "client") {
    redirect(isAuthRole(user.role) ? getRoleDashboardPath(user.role) : "/")
  }

  return <MonAvis role={avisTypeFromRole(user.role)} />
}
