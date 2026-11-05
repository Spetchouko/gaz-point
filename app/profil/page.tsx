import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/db"
import { user as userTable } from "@/db/schema"
import { Profil } from "@/app/_components/profil"
import { ClientLayout } from "@/app/_components/client-layout"
import { requireUser } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Mon profil | GazPoints" },
}

export default async function ProfilPage() {
  const sessionUser = await requireUser()

  const rows = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, sessionUser.id))
    .limit(1)

  const profile = rows[0]
  if (!profile) redirect("/connexion")

  return (
    <ClientLayout
      clientName={profile.name ?? "Usager"}
      clientEmail={profile.email}
    >
      <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
        <div className="container mx-auto max-w-4xl px-4">
          <Profil
            pro={profile.role === "vendor" || profile.role === "admin" || profile.role === "collaborateur"}
            profile={{
              name: profile.name,
              email: profile.email,
              phoneNumber: profile.phoneNumber,
              role: profile.role,
              image: profile.image,
              createdAt: profile.createdAt.toISOString(),
            }}
          />
        </div>
      </div>
    </ClientLayout>
  )
}
