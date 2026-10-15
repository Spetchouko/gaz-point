import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user as userTable } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireStaff } from "@/lib/session"
import { AdminProfilEditor } from "@/app/_components/admin-profil-editor"

export const metadata: Metadata = {
  title: { absolute: "Mon profil | Administration GAZ POINT" },
}

export default async function AdminProfilPage() {
  const staff = await requireStaff()
  const userId = staff.user.id

  const rows = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, userId))
    .limit(1)

  const profile = rows[0]
  if (!profile) redirect("/connexion")

  const role = (profile.role === "admin" || profile.role === "collaborateur") ? profile.role : "admin"

  return (
    <div className="space-y-8">
      <AdminProfilEditor profile={profile} role={role} />
    </div>
  )
}