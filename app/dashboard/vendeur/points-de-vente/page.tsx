import { asc, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { pointDeVente } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { PointsDeVenteClient } from "./client"

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

  async function onSavePoint(values: {
    name: string
    district: string
    address: string
    phone: string | null
  }) {
    if (values.name) {
      await db
        .insert(pointDeVente)
        .values({
          id: crypto.randomUUID(),
          name: values.name,
          district: values.district,
          address: values.address,
          phone: values.phone,
          vendorId: user.id,
          isActive: true,
          createdAt: new Date(),
        })
    }
  }

  async function onDeletePoint(pointId: string) {
    await db.delete(pointDeVente).where(eq(pointDeVente.id, pointId))
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
        points={points}
        onSavePoint={onSavePoint}
        onDeletePoint={onDeletePoint}
      />
    </VendorLayout>
  )
}
