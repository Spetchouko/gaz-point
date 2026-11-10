import { asc, count, desc, eq, and, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { db } from "@/db"
import {
  user,
  pointDeVente,
  disponibilite,
  brand,
  pointDeVenteBouteille,
  reservation,
  vendorOnboarding,
} from "@/db/schema"
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

  // Get vendor's points de vente
  const points = await db
    .select()
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  // Brouillon d'onboarding du vendeur (une seule ligne par compte).
  const [onboardingRow] = await db
    .select()
    .from(vendorOnboarding)
    .where(eq(vendorOnboarding.userId, user.id))
    .limit(1)

  // Get bottles for each point de vente (avec la quantité réelle en stock)
  let bottlesByPoint = new Map<
    string,
    Array<{ brand: string; format: string; quantity: number }>
  >()
  let inventoryQuantity = 0
  if (points.length > 0) {
    const bottleRows = await db
      .select({
        pointDeVenteId: pointDeVenteBouteille.pointDeVenteId,
        brand: brand.name,
        format: pointDeVenteBouteille.format,
        quantity: pointDeVenteBouteille.quantity,
      })
      .from(pointDeVenteBouteille)
      .innerJoin(brand, eq(pointDeVenteBouteille.brandId, brand.id))
      .where(inArray(pointDeVenteBouteille.pointDeVenteId, points.map((p) => p.id)))
    for (const row of bottleRows) {
      const existing = bottlesByPoint.get(row.pointDeVenteId) ?? []
      existing.push({ brand: row.brand, format: row.format, quantity: row.quantity })
      bottlesByPoint.set(row.pointDeVenteId, existing)
      inventoryQuantity += row.quantity
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
    // Stock réel : somme des quantités d'inventaire du vendeur (aucune
    // valeur fictive, aucun point d'un autre vendeur).
    totalQuantity: inventoryQuantity,
    availablePoints: pointsWithStats.filter((p) => p.isAvailable).length,
    lastUpdate,
    hasPointDeVente,
    hasBottles,
    hasDisponibilites,
  }

  // L'onboarding est requis tant que le point de vente n'est pas finalisé.
  // Un vendeur Google (sans brouillon) mais déjà doté d'un point de vente
  // n'est pas relancé.
  const needsOnboarding = onboardingRow
    ? onboardingRow.status !== "completed"
    : points.length === 0

  // Un brouillon existe (inscrit par email) : le point finalisé reste éditable
  // depuis la même modale, sans risque de doublon.
  const canEditOnboarding = Boolean(onboardingRow)

  const onboardingInitial = {
    pointName: onboardingRow?.pointName ?? user.name ?? "",
    district: onboardingRow?.district ?? "",
    address: onboardingRow?.address ?? "",
    phone: onboardingRow?.phone ?? null,
    brands: onboardingRow?.brands ?? [],
    inventory: onboardingRow?.inventory ?? [],
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
        needsOnboarding={needsOnboarding}
        canEditOnboarding={canEditOnboarding}
        onboardingInitial={onboardingInitial}
      />
    </VendorLayout>
  )
}