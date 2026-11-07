import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminClientDetail } from "@/app/_components/admin-client-detail"
import { requireStaffModule } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Client détaillé | Administration GAZ POINT" },
}

export default async function AdminClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const staff = await requireStaffModule("clients")
  const { id } = await params

  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1)
  const profile = rows[0]
  if (!profile) redirect("/admin/clients")

  return <AdminClientDetail profile={profile} currentUserId={staff.user.id} />
}
