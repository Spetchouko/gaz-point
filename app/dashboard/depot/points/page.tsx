import { DepotPointsPage } from "@/app/_components/vendor/depot-points-page"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"
import { requireVendor } from "@/lib/session"
import { getVendorDepots } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function DepotPointsPageWrapper() {
  const user = await requireVendor()

  let depots: Awaited<ReturnType<typeof getVendorDepots>>
  try {
    depots = await getVendorDepots(user.id)
  } catch (err) {
    console.error("[depot/points/page] Chargement des dépôts impossible:", err)
    return (
      <VendorLoadError
        message="Impossible de charger vos points de vente."
        detail="Vos données sont intactes. Réessayez dans un instant."
      />
    )
  }

  return <DepotPointsPage initialDepots={depots} />
}