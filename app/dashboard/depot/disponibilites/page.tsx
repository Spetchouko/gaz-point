import { VendorAvailabilityManager } from "@/app/_components/vendor/vendor-availability-manager"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"
import { requireVendor } from "@/lib/session"
import { getVendorAvailabilities, getVendorDepot } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

async function loadAvailabilityData(userId: string) {
  const [depot, availabilities] = await Promise.all([
    getVendorDepot(userId),
    getVendorAvailabilities(userId),
  ])
  return { depot, availabilities }
}

export default async function DisponibilitesPage() {
  const user = await requireVendor()

  let data: Awaited<ReturnType<typeof loadAvailabilityData>>
  try {
    data = await loadAvailabilityData(user.id)
  } catch (err) {
    console.error("[depot/disponibilites] Chargement impossible:", err)
    return (
      <VendorLoadError
        message="Impossible de charger vos disponibilités."
        detail="Vos données sont intactes. Réessayez dans un instant."
      />
    )
  }

  return (
    <VendorAvailabilityManager depot={data.depot} availabilities={data.availabilities} />
  )
}
