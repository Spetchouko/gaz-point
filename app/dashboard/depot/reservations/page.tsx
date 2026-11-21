import { VendorReservationsManager } from "@/app/_components/vendor/vendor-reservations-manager"
import { requireVendor } from "@/lib/session"
import { getVendorDepot, getVendorReservations } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function ReservationsPage() {
  const user = await requireVendor()
  const [depot, reservations] = await Promise.all([
    getVendorDepot(user.id),
    getVendorReservations(user.id),
  ])

  return (
    <VendorReservationsManager
      reservations={reservations}
      depotName={depot?.name ?? null}
    />
  )
}
