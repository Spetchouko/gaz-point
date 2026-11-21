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
    error = err instanceof Error ? err.message : "Erreur inconnue lors du chargement du dashboard"
    console.error("[vendor-dashboard] Erreur lors du chargement de l'aperçu vendeur:", error)
    // Valeurs par défaut sûres pour éviter que le dashboard ne reste bloqué
    data = {
      depot: null,
      stats: {
        depotCount: 0,
        activeAvailabilityCount: 0,
        reservationCount: 0,
      },
      activities: [],
      hasAnyData: false,
    }
  }

  return <VendorOverview data={data} error={error} />
}
