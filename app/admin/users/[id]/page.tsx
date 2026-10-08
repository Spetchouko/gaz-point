import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminUserDetail } from "@/app/_components/admin-user-detail"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Utilisateur | Administration GazPoint" },
}

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1)
  const profile = rows[0]
  if (!profile) redirect("/admin/users")

  return <AdminUserDetail profile={profile} />
}