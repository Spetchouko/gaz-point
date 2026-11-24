import { VendorReservationsManager } from "@/app/_components/vendor/vendor-reservations-manager"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"
import { requireVendor } from "@/lib/session"
import { getVendorDepot, getVendorReservations } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

async function loadReservationData(userId: string) {
  const [depot, reservations] = await Promise.all([
    getVendorDepot(userId),
    getVendorReservations(userId),
  ])
  return { depot, reservations }
}

export default async function ReservationsPage() {
  const user = await requireVendor()

  let data: Awaited<ReturnType<typeof loadReservationData>>
  try {
    data = await loadReservationData(user.id)
  } catch (err) {
    console.error("[depot/reservations] Chargement impossible:", err)
    return (
      <VendorLoadError
        message="Impossible de charger vos réservations."
        detail="Vos données sont intactes. Réessayez dans un instant."
      />
    )
  }

  return (
    <VendorReservationsManager
      reservations={data.reservations}
      depotName={data.depot?.name ?? null}
    />
  )
}
