"use server"

import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
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
  const quantityRaw = String(formData.get("quantity") ?? "").trim()
  const format = String(formData.get("format") ?? "").trim() || null
  const phone = String(formData.get("phone") ?? "").trim() || null

  const quantity = quantityRaw ? Number.parseInt(quantityRaw, 10) : null

  if (!pointId) {
    return { ok: false, message: "Point de vente introuvable." }
  }
  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Choisis un statut de disponibilité." }
  }
  if (quantity !== null && (!Number.isFinite(quantity) || quantity < 0)) {
    return { ok: false, message: "Quantité invalide." }
  }
  if (phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phone)) {
    return { ok: false, message: "Format de téléphone invalide." }
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
      message: "Ce dépôt n'est pas rattaché à ton compte.",
    }
  }

  await db.insert(disponibilite).values({
    id: randomUUID(),
    pointId,
    status,
    note,
    quantity,
    format,
    phone,
    reportedBy: user.id,
    reportedByName: user.name,
    source: role === "admin" ? "administration" : "vendeur",
  })

  revalidatePath("/dashboard/pro")
  revalidatePath("/dashboard/vendeur")
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
  revalidatePath("/dashboard/vendeur")
  return {
    ok: true,
    message: assignedVendor
      ? "Vendeur rattaché au dépôt."
      : "Rattachement du vendeur retiré.",
  }
}

export async function deleteDisponibilite(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requirePro()

  const disponibiliteId = String(formData.get("disponibiliteId") ?? "")

  if (!disponibiliteId) {
    return { ok: false, message: "Disponibilité introuvable." }
  }

  const [dispo] = await db
    .select({
      id: disponibilite.id,
      pointId: disponibilite.pointId,
    })
    .from(disponibilite)
    .where(eq(disponibilite.id, disponibiliteId))
    .limit(1)

  if (!dispo) {
    return { ok: false, message: "Disponibilité introuvable." }
  }

  const [point] = await db
    .select({ id: pointDeVente.id, vendorId: pointDeVente.vendorId })
    .from(pointDeVente)
    .where(eq(pointDeVente.id, dispo.pointId))
    .limit(1)

  if (!point) {
    return { ok: false, message: "Point de vente associé introuvable." }
  }

  if (role === "vendor" && point.vendorId !== user.id) {
    return {
      ok: false,
      message: "Tu ne peux supprimer que tes propres disponibilités.",
    }
  }

  await db.delete(disponibilite).where(eq(disponibilite.id, disponibiliteId))

  revalidatePath("/dashboard/pro")
  revalidatePath("/dashboard/vendeur")
  revalidatePath("/dashboard/vendeur/espace-pro")
  return { ok: true, message: "Disponibilité supprimée." }
}

export async function upsertDisponibilite(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { user, role } = await requirePro()

  const pointId = String(formData.get("pointId") ?? "")
  const format = String(formData.get("format") ?? "").trim() || null
  const status = String(formData.get("status") ?? "") as AvailabilityStatus
  const phone = String(formData.get("phone") ?? "").trim() || null
  const quantityRaw = String(formData.get("quantity") ?? "").trim()
  const directions = String(formData.get("directions") ?? "").trim() || null
  const disponibiliteId = String(formData.get("disponibiliteId") ?? "")

  const quantity = quantityRaw ? Number.parseInt(quantityRaw, 10) : null

  if (!pointId) {
    return { ok: false, message: "Point de vente introuvable." }
  }
  if (!format) {
    return { ok: false, message: "Choisis un format de bouteille." }
  }
  if (!STATUSES.includes(status)) {
    return { ok: false, message: "Choisis un statut de disponibilité." }
  }
  if (quantity === null || !Number.isFinite(quantity) || quantity < 0) {
    return { ok: false, message: "Quantité invalide (entier >= 0 requis)." }
  }
  if (phone && !/^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/.test(phone)) {
    return { ok: false, message: "Format de téléphone invalide." }
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
      message: "Ce dépôt n'est pas rattaché à ton compte.",
    }
  }

  // Auto-status based on quantity if not explicitly set by user
  const effectiveStatus = quantity > 0 ? "disponible" : "indisponible"

  if (disponibiliteId) {
    // UPDATE existing
    const [existing] = await db
      .select({ id: disponibilite.id, pointId: disponibilite.pointId })
      .from(disponibilite)
      .where(eq(disponibilite.id, disponibiliteId))
      .limit(1)

    if (!existing) {
      return { ok: false, message: "Disponibilité introuvable." }
    }
    if (role === "vendor" && point.vendorId !== user.id) {
      return { ok: false, message: "Tu ne peux modifier que tes propres disponibilités." }
    }

    await db
      .update(disponibilite)
      .set({
        status: effectiveStatus,
        format,
        quantity,
        phone,
        note: directions,
        updatedAt: new Date(),
      })
      .where(eq(disponibilite.id, disponibiliteId))

    revalidatePath("/dashboard/pro")
    revalidatePath("/dashboard/vendeur")
    revalidatePath("/dashboard/vendeur/espace-pro")
    return { ok: true, message: "Disponibilité mise à jour avec succès." }
  } else {
    // CHECK for existing dispo for same point + format (upsert logic)
    const [existing] = await db
      .select({ id: disponibilite.id })
      .from(disponibilite)
      .where(and(eq(disponibilite.pointId, pointId), eq(disponibilite.format, format)))
      .limit(1)

    if (existing) {
      // UPDATE existing for same point+format
      await db
        .update(disponibilite)
        .set({
          status: effectiveStatus,
          quantity,
          phone,
          note: directions,
          updatedAt: new Date(),
        })
        .where(eq(disponibilite.id, existing.id))

      revalidatePath("/dashboard/pro")
      revalidatePath("/dashboard/vendeur")
      revalidatePath("/dashboard/vendeur/espace-pro")
      return { ok: true, message: "Disponibilité mise à jour (format existant)." }
    } else {
      // INSERT new
      await db.insert(disponibilite).values({
        id: randomUUID(),
        pointId,
        status: effectiveStatus,
        format,
        quantity,
        phone,
        note: directions,
        reportedBy: user.id,
        reportedByName: user.name,
        source: role === "admin" ? "administration" : "vendeur",
      })

      revalidatePath("/dashboard/pro")
      revalidatePath("/dashboard/vendeur")
      revalidatePath("/dashboard/vendeur/espace-pro")
      return { ok: true, message: "Disponibilité publiée avec succès." }
    }
  }
}
