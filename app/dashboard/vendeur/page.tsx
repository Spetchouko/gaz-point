import { VendorOverview } from "@/app/_components/vendor/vendor-overview"
import { requireVendor } from "@/lib/session"
import { getVendorOverview } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function VendorDashboardPage() {
  const user = await requireVendor()

  let data: Awaited<ReturnType<typeof getVendorOverview>>
  let error: string | null = null

  try {
    data = await getVendorOverview(user.id)
  } catch (err) {
    console.error("[vendor-dashboard] Erreur lors du chargement de l'aperçu vendeur:", err)
    // Le détail reste dans les logs serveur ; l'utilisateur voit un message clair.
    error = "Impossible de charger votre tableau de bord pour le moment."
    data = {
      depot: null,
      stats: {
        depotCount: 0,
        activeAvailabilityCount: 0,
        reservationCount: 0,
      },
      activities: [],
      hasAnyData: false,
      loadErrors: [error],
    }
  }

  return <VendorOverview data={data} error={error} />
}
