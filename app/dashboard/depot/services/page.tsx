import { VendorServicesManager } from "@/app/_components/vendor/vendor-services-manager"
import { requireVendor } from "@/lib/session"
import { getVendorDepot } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function ServicesPage() {
  const user = await requireVendor()
  const depot = await getVendorDepot(user.id)

  return <VendorServicesManager depot={depot} />
}
