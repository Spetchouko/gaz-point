import { and, asc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { DisponibilitesClient } from "./client"
import { createDisponibilite, deleteDisponibilite, updateDisponibilite } from "./actions"

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
        onSaveDispo={createDisponibilite}
        onUpdateDispo={updateDisponibilite}
        onDeleteDispo={deleteDisponibilite}
      />
    </VendorLayout>
  )
}