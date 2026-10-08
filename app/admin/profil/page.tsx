import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user as userTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { Profil } from "@/app/_components/profil"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Mon profil | Administration GazPoint" },
}

export default async function AdminProfilPage() {
  const sessionUser = await requireAdmin()

  const rows = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, sessionUser.id))
    .limit(1)

  const profile = rows[0]
  if (!profile) redirect("/connexion")

  return (
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
  )
}