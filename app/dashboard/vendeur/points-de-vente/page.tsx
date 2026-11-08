import { and, asc, count, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { PointsDeVenteClient } from "./client"
import { createPointDeVenteVendor, deletePointDeVenteVendor, togglePointDeVente } from "@/app/dashboard/pro/actions"
import type { ActionResult } from "@/app/dashboard/pro/actions"

export const metadata: Metadata = {
  title: { absolute: "Mes points de vente | GazPoints" },
}

export default async function PointsDeVentePage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
      address: pointDeVente.address,
      phone: pointDeVente.phone,
      isActive: pointDeVente.isActive,
      createdAt: pointDeVente.createdAt,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  // Get count of disponibilités for each point
  const pointsWithCounts = await Promise.all(
    points.map(async (point) => {
      const result = await db
        .select({ count: count() })
        .from(disponibilite)
        .where(eq(disponibilite.pointId, point.id))
      const dispoCount = Number(result[0]?.count ?? 0)
      return { ...point, dispoCount }
    })
  )

  // Wrapper functions to match the expected client signature
  const onCreatePoint = async (formData: FormData): Promise<ActionResult> => {
    return createPointDeVenteVendor(null, formData)
  }

  const onUpdatePoint = async (formData: FormData): Promise<ActionResult> => {
    return togglePointDeVente(null, formData)
  }

  const onDeletePoint = async (formData: FormData): Promise<ActionResult> => {
    return deletePointDeVenteVendor(null, formData)
  }

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      <PointsDeVenteClient
        userName={user.name ?? "Vendeur"}
        userEmail={user.email}
        points={pointsWithCounts}
        onCreatePoint={onCreatePoint}
        onUpdatePoint={onUpdatePoint}
        onDeletePoint={onDeletePoint}
      />
    </VendorLayout>
  )
}