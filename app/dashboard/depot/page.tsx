import { VendorDepotManager } from "@/app/_components/vendor/vendor-depot-manager"
import { requireVendor } from "@/lib/session"
import { getVendorDepot, getVendorOnboarding } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function DepotPage() {
  const user = await requireVendor()
  const [depot, onboarding] = await Promise.all([
    getVendorDepot(user.id),
    getVendorOnboarding(user.id),
  ])

  return <VendorDepotManager depot={depot} onboarding={onboarding} />
}
