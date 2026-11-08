"use server"

import { db } from "@/db"
import { disponibilite } from "@/db/schema"
import { requirePro } from "@/lib/session"
import { eq, and } from "drizzle-orm"

export async function createDisponibilite(values: {
  pointId: string
  pointName?: string
  format?: string | null
  status: "disponible" | "a_confirmer" | "indisponible"
  note?: string | null
  quantity?: number | null
  brand?: string | null
}) {
  const { user } = await requirePro()

  await db.insert(disponibilite).values({
    id: crypto.randomUUID(),
    pointId: values.pointId,
    vendorId: user.id,
    status: values.status,
    note: values.note ?? null,
    quantity: values.quantity ?? null,
    format: values.format ?? null,
    brand: values.brand ?? null,
    reportedBy: user.id,
    reportedByName: user.name ?? "Vendeur",
    source: "vendeur",
    createdAt: new Date(),
  })
}

export async function updateDisponibilite(
  dispoId: string,
  values: {
    pointId: string
    pointName?: string
    format?: string | null
    status: "disponible" | "a_confirmer" | "indisponible"
    note?: string | null
    quantity?: number | null
    brand?: string | null
  }
) {
  const { user } = await requirePro()

  await db
    .update(disponibilite)
    .set({
      pointId: values.pointId,
      status: values.status,
      note: values.note ?? null,
      quantity: values.quantity ?? null,
      format: values.format ?? null,
      brand: values.brand ?? null,
      updatedAt: new Date(),
    })
    .where(and(eq(disponibilite.id, dispoId), eq(disponibilite.vendorId, user.id)))
}

export async function deleteDisponibilite(dispoId: string) {
  const { user } = await requirePro()

  await db.delete(disponibilite).where(
    and(eq(disponibilite.id, dispoId), eq(disponibilite.vendorId, user.id))
  )
}