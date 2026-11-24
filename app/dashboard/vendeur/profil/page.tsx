import { VendorProfileManager } from "@/app/_components/vendor/vendor-profile-manager"
import { VendorLoadError } from "@/app/_components/vendor/vendor-load-error"
import { requireVendor } from "@/lib/session"
import { getVendorProfile } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function VendorProfilePage() {
  const user = await requireVendor()

  let profile: Awaited<ReturnType<typeof getVendorProfile>>
  try {
    profile = await getVendorProfile(user.id)
  } catch (err) {
    console.error("[vendeur/profil] Chargement impossible:", err)
    return (
      <VendorLoadError
        message="Impossible de charger votre profil."
        detail="Vos données sont intactes. Réessayez dans un instant."
      />
    )
  }

  if (!profile) {
    return (
      <VendorLoadError
        message="Impossible de charger votre profil."
        detail="Reconnectez-vous si le problème persiste."
      />
    )
  }

  return <VendorProfileManager profile={profile} />
}
