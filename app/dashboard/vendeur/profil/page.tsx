import { eq } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { user as userTable } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { Profil } from "@/app/_components/profil"

export const metadata: Metadata = {
  title: { absolute: "Mon profil | GazPoints" },
}

export default async function ProfilVendeurPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  const rows = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, user.id))
    .limit(1)

  const profile = rows[0]
  if (!profile) return null

  return (
    <VendorLayout
      role={role}
      vendorName={profile.name ?? "Vendeur"}
      vendorEmail={profile.email}
    >
      <Profil
        pro={true}
        profile={{
          name: profile.name,
          email: profile.email,
          phoneNumber: profile.phoneNumber,
          role: profile.role,
          image: profile.image,
          createdAt: profile.createdAt.toISOString(),
        }}
      />
    </VendorLayout>
  )
}