import { asc, count, desc, eq, and, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import { user, pointDeVente, disponibilite, brand, pointDeVenteBouteille, reservation } from "@/db/schema"
import { DashboardVendeur } from "@/app/_components/dashboard-vendeur"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { effectiveStatus } from "@/lib/gaz"

export const revalidate = 60

export const metadata: Metadata = {
  title: { absolute: "Espace vendeur | GazPoints" },
}

type DispoRow = typeof disponibilite.$inferSelect

export default async function DashboardVendeurPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  // Check subscription status
  const [subscription] = await db
    .select()
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .limit(1)

  // If no subscription or not active, redirect to payment
  // Note: vendorSubscription import would be needed, for now we skip the check

  // Get vendor's points de vente
  const points = await db
    .select()
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  // Get bottles for each point de vente
  let bottlesByPoint = new Map<string, Array<{ brand: string; format: string }>>()
  if (points.length > 0) {
    const bottleRows = await db
      .select({
        pointDeVenteId: pointDeVenteBouteille.pointDeVenteId,
        brand: brand.name,
        format: pointDeVenteBouteille.format,
      })
      .from(pointDeVenteBouteille)
      .innerJoin(brand, eq(pointDeVenteBouteille.brandId, brand.id))
      .where(inArray(pointDeVenteBouteille.pointDeVenteId, points.map((p) => p.id)))
    for (const row of bottleRows) {
      const existing = bottlesByPoint.get(row.pointDeVenteId) ?? []
      existing.push({ brand: row.brand, format: row.format })
      bottlesByPoint.set(row.pointDeVenteId, existing)
    }
  }

  // Compute pathway status
  const hasPointDeVente = points.length > 0
  const hasBottles = hasPointDeVente ? points.some((p) => {
    const bottles = bottlesByPoint.get(p.id) ?? []
    return bottles.length > 0
  }) : false
  const hasDisponibilites = hasBottles ? (await Promise.all(
    points.map(async (p) => {
      const pointId = p.id
      const dispoCount = (await db
        .select({ count: count() })
        .from(disponibilite)
        .where(eq(disponibilite.pointId, pointId))).at(0)?.count ?? 0
      return dispoCount > 0
    })
  )).some(Boolean) : false

  const pathwayStatus = [
    { step: 1, label: "Point de vente", completed: hasPointDeVente, href: "/dashboard/vendeur/points-de-vente" },
    { step: 2, label: "Enregistrement des bouteilles", completed: hasBottles, href: "/dashboard/vendeur/mes-bouteilles" },
    { step: 3, label: "Première disponibilité", completed: hasDisponibilites, href: "/dashboard/vendeur/disponibilites" },
  ]

  const dispoByPoint = new Map<string, DispoRow[]>()
  let totalQuantity = 0
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

      if (report.status === "disponible" && report.quantity && report.quantity > 0) {
        totalQuantity += report.quantity
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

    const pointBottles = bottlesByPoint.get(point.id) ?? []
    const hasPointBottles = pointBottles.length > 0

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
      hasPointBottles,
      pointBottles,
    }
  })

  const globalStats = {
    totalPoints: points.length,
    totalDispos: pointsWithStats.reduce((sum, p) => sum + p.disponibilites.length, 0),
    totalQuantity,
    availablePoints: pointsWithStats.filter((p) => p.isAvailable).length,
    lastUpdate,
    hasPointDeVente,
    hasBottles,
    hasDisponibilites,
  }

  const [totalReservations, pendingReservations] = await Promise.all([
    db
      .select({ count: count() })
      .from(reservation)
      .where(eq(reservation.vendorId, user.id)),
    db
      .select({ count: count() })
      .from(reservation)
      .where(
        and(
          eq(reservation.vendorId, user.id),
          eq(reservation.status, "confirmed")
        )
      ),
  ])

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      <DashboardVendeur
        vendorName={user.name}
        points={pointsWithStats}
        globalStats={{
          ...globalStats,
          totalReservations: Number(totalReservations[0]?.count ?? 0),
          pendingReservations: Number(pendingReservations[0]?.count ?? 0),
        }}
        pathwayStatus={pathwayStatus}
        bottlesByPoint={bottlesByPoint}
      />
    </VendorLayout>
  )
}