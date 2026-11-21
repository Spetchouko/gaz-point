import { VendorAvailabilityManager } from "@/app/_components/vendor/vendor-availability-manager"
import { requireVendor } from "@/lib/session"
import { getVendorAvailabilities, getVendorDepot } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function DisponibilitesPage() {
  const user = await requireVendor()
  const [depot, availabilities] = await Promise.all([
    getVendorDepot(user.id),
    getVendorAvailabilities(user.id),
  ])

  return (
    <VendorAvailabilityManager depot={depot} availabilities={availabilities} />
  )
}
