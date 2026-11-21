import { VendorProfileManager } from "@/app/_components/vendor/vendor-profile-manager"
import { requireVendor } from "@/lib/session"
import { getVendorProfile } from "@/lib/vendor-dashboard"

export const dynamic = "force-dynamic"

export default async function VendorProfilePage() {
  const user = await requireVendor()
  const profile = await getVendorProfile(user.id)

  if (!profile) {
    return (
      <div className="rounded-lg border border-destructive/25 bg-destructive/5 p-4 text-sm text-destructive">
        Impossible de charger votre profil. Reconnectez-vous puis réessayez.
      </div>
    )
  }

  return <VendorProfileManager profile={profile} />
}
