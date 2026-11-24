import { VendorDepotManager } from "@/app/_components/vendor/vendor-depot-manager"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"
import { requireVendor } from "@/lib/session"
import { getVendorDepot, getVendorOnboarding } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

async function loadDepotData(userId: string) {
  const [depot, onboarding] = await Promise.all([
    getVendorDepot(userId),
    getVendorOnboarding(userId),
  ])
  return { depot, onboarding }
}

export default async function DepotPage() {
  const user = await requireVendor()

  let data: Awaited<ReturnType<typeof loadDepotData>>
  try {
    data = await loadDepotData(user.id)
  } catch (err) {
    // La cause réelle reste dans les logs serveur ; aucun détail n'est exposé.
    console.error("[depot/page] Chargement du dépôt impossible:", err)
    return (
      <VendorLoadError
        message="Impossible de charger les informations de votre dépôt."
        detail="Vos données sont intactes. Réessayez dans un instant."
      />
    )
  }

  return <VendorDepotManager depot={data.depot} onboarding={data.onboarding} />
}
