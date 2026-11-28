import { VendorDepotManager } from "@/app/_components/vendor/vendor-depot-manager"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"
import { requireVendor } from "@/lib/session"
import { getVendorDepot, getVendorOnboarding, type VendorDepotDto } from "@/lib/vendor-dashboard"
import { getDepotRowById } from "@/lib/vendor-depot-compat"

export const dynamic = "force-dynamic"

async function loadDepotData(userId: string, depotId?: string) {
  const onboarding = await getVendorOnboarding(userId)

  let depot: VendorDepotDto | null = null

  if (depotId) {
    // Édition d'un dépôt spécifique : vérifier qu'il appartient bien au vendeur.
    const row = await getDepotRowById(depotId)
    if (!row || row.vendorId !== userId) {
      return { depot: null, onboarding, notFound: true }
    }
    depot = row
  } else {
    depot = await getVendorDepot(userId)
  }

  return { depot, onboarding, notFound: false }
}

export default async function DepotPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const user = await requireVendor()

  const params = await searchParams
  const depotId = typeof params.id === "string" ? params.id : undefined
  const forceCreation = params.new === "1"

  let data: Awaited<ReturnType<typeof loadDepotData>>
  try {
    data = await loadDepotData(user.id, forceCreation ? undefined : depotId)
  } catch (err) {
    console.error("[depot/page] Chargement du dépôt impossible:", err)
    return (
      <VendorLoadError
        message="Impossible de charger les informations du dépôt."
        detail="Vos données sont intactes. Réessayez dans un instant."
      />
    )
  }

  if (data.notFound) {
    return (
      <VendorLoadError
        message="Dépôt introuvable"
        detail="Ce point de vente n'existe pas ou ne vous appartient pas."
      />
    )
  }

  return <VendorDepotManager depot={data.depot} onboarding={data.onboarding} />
}
