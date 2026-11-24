import { VendorServicesManager } from "@/app/_components/vendor/vendor-services-manager"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"
import { requireVendor } from "@/lib/session"
import { getVendorDepot } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const user = await requireVendor()

  let depot: Awaited<ReturnType<typeof getVendorDepot>>
  try {
    depot = await getVendorDepot(user.id)
  } catch (err) {
    console.error("[depot/services] Chargement impossible:", err)
    return (
      <VendorLoadError
        message="Impossible de charger la configuration de vos services."
        detail="Vos données sont intactes. Réessayez dans un instant."
      />
    )
  }

  return <VendorServicesManager depot={depot} />
}
