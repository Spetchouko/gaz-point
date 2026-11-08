import { and, asc, count, eq, inArray } from "drizzle-orm"
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

interface DisponibilitesPageProps {
  searchParams: Promise<{ pointId?: string }>
}

export default async function DisponibilitesPage({ searchParams }: DisponibilitesPageProps) {
  const resolvedSearchParams = await searchParams
  const pointId = resolvedSearchParams.pointId ?? null

  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  // Build query filters based on pointId
  const pointFilter = pointId ? eq(pointDeVente.id, pointId) : undefined

  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
    })
    .from(pointDeVente)
    .where(pointFilter ?? eq(pointDeVente.vendorId, user.id))
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
      delivery: disponibilite.delivery,
      exchange: disponibilite.exchange,
      gasSale: disponibilite.gasSale,
      createdAt: disponibilite.createdAt,
    })
    .from(disponibilite)
    .where(pointId
      ? and(eq(disponibilite.pointId, pointId), eq(disponibilite.vendorId, user.id))
      : eq(disponibilite.vendorId, user.id))

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