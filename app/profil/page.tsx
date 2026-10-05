import { eq } from "drizzle-orm"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { db } from "@/db"
import { user as userTable } from "@/db/schema"
import { Profil } from "@/app/_components/profil"
import { requireUser } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Mon profil | GazPoint" },
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
    <Profil
      pro={profile.role === "vendor" || profile.role === "admin"}
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
