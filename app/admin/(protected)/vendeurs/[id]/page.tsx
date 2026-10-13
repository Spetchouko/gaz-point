import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user, pointDeVente, disponibilite } from "@/db/schema"
import { eq, inArray, desc } from "drizzle-orm"
import { AdminVendeurDetail } from "@/app/_components/admin-vendeur-detail"
import { requireStaffModule } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Vendeur | Administration GAZ POINT" },
}

export default async function AdminVendeurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireStaffModule("vendeurs")
  const { id } = await params

  const vendorRows = await db.select().from(user).where(eq(user.id, id)).limit(1)

  const vendor = vendorRows[0]
  if (!vendor || vendor.role !== "vendor") redirect("/admin/vendeurs")

  const points = await db
    .select()
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, id))
    .orderBy(desc(pointDeVente.createdAt))

  const pointIds = points.map((p) => p.id)
  const dispos = pointIds.length
    ? await db
        .select()
        .from(disponibilite)
        .where(inArray(disponibilite.pointId, pointIds))
        .orderBy(desc(disponibilite.createdAt))
    : []

  const dispoByPoint = new Map<string, typeof dispos[0][]>()
  for (const d of dispos) {
    const existing = dispoByPoint.get(d.pointId) ?? []
    existing.push(d)
    dispoByPoint.set(d.pointId, existing)
  }

  const pointsWithDispos = points.map((p) => ({
    ...p,
    disponibilites: dispoByPoint.get(p.id) ?? [],
  }))

  return <AdminVendeurDetail vendor={vendor} points={pointsWithDispos} />
}