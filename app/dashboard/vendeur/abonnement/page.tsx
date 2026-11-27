import { VendorSubscriptionPage } from "@/app/_components/vendor/vendor-subscription-page"
import { requireVendor } from "@/lib/session"

export const dynamic = "force-dynamic"

export default async function VendorSubscriptionRoute() {
  const user = await requireVendor()
  return <VendorSubscriptionPage vendorId={user.id} vendorEmail={user.email} vendorName={user.name} />
}