import { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user, pointDeVente, disponibilite } from "@/db/schema"
import { eq, inArray, desc } from "drizzle-orm"
import { AdminVendeurDetail } from "@/app/_components/admin-vendeur-detail"
import { requireAdmin } from "@/lib/session"

export const metadata: Metadata = {
  title: { absolute: "Vendeur | Administration GazPoint" },
}

export default async function AdminVendeurDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  await requireAdmin()
  const { id } = await params

  const [vendorRows, points, dispos] = await Promise.all([
    db.select().from(user).where(eq(user.id, id)).limit(1),
    db.select().from(pointDeVente).where(eq(pointDeVente.vendorId, id)).orderBy(desc(pointDeVente.createdAt)),
    db
      .select()
      .from(disponibilite)
      .where(
        inArray(
          disponibilite.pointId,
          points.map((p) => p.id)
        )
      )
      .orderBy(desc(disponibilite.createdAt)),
  ])

  const vendor = vendorRows[0]
  if (!vendor || vendor.role !== "vendor") redirect("/admin/vendeurs")

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