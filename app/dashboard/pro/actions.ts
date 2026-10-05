"use server"

import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import {
  disponibilite,
  pointDeVente,
  user as userTable,
  type AvailabilityStatus,
} from "@/db/schema"
import { requirePro } from "@/lib/session"

export type ActionResult = { ok: boolean; message: string }

const STATUSES: AvailabilityStatus[] = [
  "disponible",
  "a_confirmer",
  "indisponible",
]

export async function reportDisponibilite(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requirePro()

  const pointId = String(formData.get("pointId") ?? "")
  const status = String(formData.get("status") ?? "") as AvailabilityStatus
  const note = String(formData.get("note") ?? "").trim() || null

  if (!pointId) {
    return { ok: false, message: "Point de vente introuvable." }
  }
  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Choisis un statut de disponibilité." }
  }

  const [point] = await db
    .select({ id: pointDeVente.id, vendorId: pointDeVente.vendorId })
    .from(pointDeVente)
    .where(eq(pointDeVente.id, pointId))
    .limit(1)
  if (!point) {
    return { ok: false, message: "Point de vente introuvable." }
  }
  if (role === "vendor" && point.vendorId !== user.id) {
    return {
      ok: false,
      message: "Ce dépôt n’est pas rattaché à ton compte.",
    }
  }

  await db.insert(disponibilite).values({
    id: randomUUID(),
    pointId,
    status,
    note,
    reportedBy: user.id,
    reportedByName: user.name,
    source: role === "admin" ? "administration" : "vendeur",
  })

  revalidatePath("/dashboard/pro")
  return {
    ok: true,
    message: "Signalement publié : statut daté et signé de ton nom.",
  }
}

export async function createPointDeVente(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { role } = await requirePro()
  if (role !== "admin") {
    return { ok: false, message: "Action réservée à l’administration." }
  }

  const name = String(formData.get("name") ?? "").trim()
  const district = String(formData.get("district") ?? "").trim()
  const address = String(formData.get("address") ?? "").trim()
  const phone = String(formData.get("phone") ?? "").trim() || null
  const vendorId = String(formData.get("vendorId") ?? "")

  if (!name || !district || !address) {
    return {
      ok: false,
      message: "Renseigne le nom, le quartier et l’adresse du dépôt.",
    }
  }

  let assignedVendor: string | null = null
  if (vendorId && vendorId !== "__none__") {
    const [vendor] = await db
      .select({ id: userTable.id, role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, vendorId))
      .limit(1)
    if (!vendor || vendor.role !== "vendor") {
      return { ok: false, message: "Le vendeur sélectionné est introuvable." }
    }
    assignedVendor = vendor.id
  }

  await db.insert(pointDeVente).values({
    id: randomUUID(),
    name,
    district,
    address,
    phone,
    vendorId: assignedVendor,
  })

  revalidatePath("/dashboard/pro")
  return { ok: true, message: `Le dépôt « ${name} » a été créé.` }
}

export async function assignVendor(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { role } = await requirePro()
  if (role !== "admin") {
    return { ok: false, message: "Action réservée à l’administration." }
  }

  const pointId = String(formData.get("pointId") ?? "")
  const vendorId = String(formData.get("vendorId") ?? "")

  const [point] = await db
    .select({ id: pointDeVente.id })
    .from(pointDeVente)
    .where(eq(pointDeVente.id, pointId))
    .limit(1)
  if (!point) {
    return { ok: false, message: "Point de vente introuvable." }
  }

  let assignedVendor: string | null = null
  if (vendorId && vendorId !== "__none__") {
    const [vendor] = await db
      .select({ id: userTable.id, role: userTable.role })
      .from(userTable)
      .where(eq(userTable.id, vendorId))
      .limit(1)
    if (!vendor || vendor.role !== "vendor") {
      return { ok: false, message: "Le vendeur sélectionné est introuvable." }
    }
    assignedVendor = vendor.id
  }

  await db
    .update(pointDeVente)
    .set({ vendorId: assignedVendor })
    .where(eq(pointDeVente.id, pointId))

  revalidatePath("/dashboard/pro")
  return {
    ok: true,
    message: assignedVendor
      ? "Vendeur rattaché au dépôt."
      : "Rattachement du vendeur retiré.",
  }
}
