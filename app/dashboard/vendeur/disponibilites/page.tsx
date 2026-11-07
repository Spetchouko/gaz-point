import { and, asc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { DisponibilitesClient } from "./client"

export const metadata: Metadata = {
  title: { absolute: "Disponibilités | GazPoints" },
}

export default async function DisponibilitesPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  const allDispos = await db
    .select({
      id: disponibilite.id,
      pointId: disponibilite.pointId,
      status: disponibilite.status,
      note: disponibilite.note,
      quantity: disponibilite.quantity,
      format: disponibilite.format,
      brand: disponibilite.brand,
      createdAt: disponibilite.createdAt,
    })
    .from(disponibilite)
    .where(inArray(disponibilite.vendorId, [user.id]))

  async function onSaveDispo(values: {
    pointId: string
    pointName: string
    format: string | null
    status: string
    note: string | null
    quantity: number | null
    brand: string | null
  }) {
    await db.insert(disponibilite).values({
      id: crypto.randomUUID(),
      pointId: values.pointId,
      vendorId: user.id,
      status: values.status,
      note: values.note,
      quantity: values.quantity,
      format: values.format,
      brand: values.brand,
      reportedBy: user.id,
      reportedByName: user.name ?? "Vendeur",
      source: "vendeur",
      createdAt: new Date(),
    })
  }

  async function onDeleteDispo(dispoId: string) {
    await db.delete(disponibilite).where(
      and(eq(disponibilite.id, dispoId), eq(disponibilite.vendorId, user.id))
    )
  }

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      <DisponibilitesClient
        userName={user.name ?? "Vendeur"}
        userEmail={user.email}
        points={points}
        allDispos={allDispos}
        onSaveDispo={onSaveDispo}
        onDeleteDispo={onDeleteDispo}
      />
    </VendorLayout>
  )
}
