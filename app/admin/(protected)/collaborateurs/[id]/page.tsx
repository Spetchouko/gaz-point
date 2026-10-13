import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user, collaborateurPermission } from "@/db/schema"
import { eq } from "drizzle-orm"
import { AdminCollaborateurDetail } from "@/app/_components/admin-collaborateur-detail"
import type { AdminModuleUi } from "@/app/_components/admin-module-labels"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Collaborateur | Administration GAZ POINT" },
}

export default async function AdminCollaborateurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const admin = await requireAdmin()
  const { id } = await params

  const rows = await db.select().from(user).where(eq(user.id, id)).limit(1)
  const profile = rows[0]
  if (!profile || (profile.role !== "admin" && profile.role !== "collaborateur")) {
    redirect("/admin/collaborateurs")
  }

  const permissionRows = await db
    .select({ module: collaborateurPermission.module })
    .from(collaborateurPermission)
    .where(eq(collaborateurPermission.collaboratorId, id))

  const permissions = permissionRows.map((r) => r.module) as AdminModuleUi[]

  return (
    <AdminCollaborateurDetail
      profile={{
        id: profile.id,
        name: profile.name,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        role: profile.role,
        image: profile.image,
        emailVerified: profile.emailVerified,
        phoneVerified: profile.phoneVerified,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
      }}
      permissions={permissions}
      currentUserId={admin.id}
    />
  )
}
