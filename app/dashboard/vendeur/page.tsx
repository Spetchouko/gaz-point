import { asc, desc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { DashboardVendeur } from "@/app/_components/dashboard-vendeur"
import { requirePro } from "@/lib/session"
import { effectiveStatus, formatDateTime } from "@/lib/gaz"

export const metadata: Metadata = {
  title: { absolute: "Espace vendeur | GazPoints" },
}

type DispoRow = typeof disponibilite.$inferSelect

export default async function DashboardVendeurPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  const points = await db
    .select()
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  const dispoByPoint = new Map<string, DispoRow[]>()
  let totalQuantity = 0
  let availableCount = 0
  let lastUpdate: Date | null = null

  if (points.length > 0) {
    const reports = await db
      .select()
      .from(disponibilite)
      .where(inArray(disponibilite.pointId, points.map((p) => p.id)))
      .orderBy(desc(disponibilite.createdAt))
    for (const report of reports) {
      const existing = dispoByPoint.get(report.pointId) ?? []
      existing.push(report)
      dispoByPoint.set(report.pointId, existing)

      // Stats globales
      if (report.status === "disponible" && report.quantity && report.quantity > 0) {
        totalQuantity += report.quantity
        availableCount++
      }
      if (!lastUpdate || new Date(report.createdAt) > lastUpdate) {
        lastUpdate = new Date(report.createdAt)
      }
    }
  }

  const pointsWithStats = points.map((point) => {
    const dispoList = dispoByPoint.get(point.id) ?? []
    const latestDispo = dispoList[0]
    const effective = latestDispo ? effectiveStatus(latestDispo.status, latestDispo.createdAt) : null
    const isAvailable = effective === "disponible"
    const totalQty = dispoList.reduce((sum, d) => sum + (d.quantity ?? 0), 0)

    return {
      id: point.id,
      name: point.name,
      district: point.district,
      address: point.address,
      phone: point.phone,
      disponibilites: dispoList,
      latestDispo,
      effectiveStatus: effective,
      isAvailable,
      totalQuantity: totalQty,
      lastUpdate: latestDispo?.createdAt ?? null,
    }
  })

  const globalStats = {
    totalPoints: points.length,
    totalDispos: pointsWithStats.reduce((sum, p) => sum + p.disponibilites.length, 0),
    totalQuantity,
    availablePoints: pointsWithStats.filter((p) => p.isAvailable).length,
    lastUpdate,
  }

  return (
    <DashboardVendeur
      vendorName={user.name}
      points={pointsWithStats}
      globalStats={globalStats}
    />
  )
}