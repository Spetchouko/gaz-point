"use server"

import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { brand, pointDeVente, pointDeVenteBouteille } from "@/db/schema"
import { requirePro } from "@/lib/session"
import {
  brandKey,
  dedupeBrands,
  normalizeBrandName,
  normalizeFormat,
  type VendorInventoryEntry,
} from "@/lib/vendor-onboarding"

export type BottleActionResult = {
  ok: boolean
  message: string
  bottle?: { id: string; brand: string; format: string; quantity: number }
}

async function requireVendorPoint(userId: string, pointId: string) {
  const [point] = await db
    .select({ id: pointDeVente.id, vendorId: pointDeVente.vendorId })
    .from(pointDeVente)
    .where(and(eq(pointDeVente.id, pointId), eq(pointDeVente.vendorId, userId)))
    .limit(1)
  if (!point) {
    throw new Error("Point de vente introuvable ou non rattaché à votre compte.")
  }
  return point
}

async function resolveOrCreateBrandId(name: string): Promise<string> {
  const cleaned = normalizeBrandName(name)
  const key = brandKey(cleaned)

  const [existing] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(eq(brand.nameKey, key))
    .limit(1)
  if (existing) return existing.id

  await db.insert(brand).values({ id: randomUUID(), name: cleaned, nameKey: key }).onConflictDoNothing()

  const [created] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(eq(brand.nameKey, key))
    .limit(1)
  if (!created) {
    throw new Error(`Impossible d'enregistrer la marque « ${cleaned} ».`)
  }
  return created.id
}

/** Ajoute une bouteille (marque + grammage) à un point de vente. */
export async function addBottle(
  _prev: BottleActionResult | null,
  formData: FormData
): Promise<BottleActionResult> {
  try {
    const { user } = await requirePro()

    const pointId = String(formData.get("pointId") ?? "").trim()
    const brandName = String(formData.get("brand") ?? "").trim()
    const format = String(formData.get("format") ?? "").trim()
    const quantityRaw = String(formData.get("quantity") ?? "0").trim()

    if (!pointId) {
      return { ok: false, message: "Point de vente introuvable." }
    }
    if (!brandName) {
      return { ok: false, message: "La marque de la bouteille est requise." }
    }
    if (!format) {
      return { ok: false, message: "Le grammage de la bouteille est requis." }
    }

    await requireVendorPoint(user.id, pointId)

    const quantity = Number.parseInt(quantityRaw, 10) || 0
    if (quantity < 0) {
      return { ok: false, message: "La quantité doit être un nombre positif ou nul." }
    }

    const brandId = await resolveOrCreateBrandId(brandName)

    // Vérifier l'absence de doublon marque + grammage pour ce point de vente.
    const [existing] = await db
      .select({ id: pointDeVenteBouteille.id })
      .from(pointDeVenteBouteille)
      .where(
        and(
          eq(pointDeVenteBouteille.pointDeVenteId, pointId),
          eq(pointDeVenteBouteille.brandId, brandId),
          eq(pointDeVenteBouteille.format, normalizeFormat(format))
        )
      )
      .limit(1)
    if (existing) {
      return {
        ok: false,
        message: `La combinaison « ${brandName} — ${format} » est déjà enregistrée pour ce point de vente.`,
      }
    }

    const id = randomUUID()
    const now = new Date()
    await db.insert(pointDeVenteBouteille).values({
      id,
      pointDeVenteId: pointId,
      brandId,
      format: normalizeFormat(format),
      quantity,
      createdAt: now,
      updatedAt: now,
    })

    // Mettre à jour la liste des marques du point de vente pour cohérence.
    const [updatedPoint] = await db
      .select({ brands: pointDeVente.brands })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, pointId))
      .limit(1)
    const currentBrands: string[] = Array.isArray(updatedPoint?.brands) ? updatedPoint.brands : []
    const newBrands = dedupeBrands([...currentBrands, normalizeBrandName(brandName)])
    await db
      .update(pointDeVente)
      .set({ brands: newBrands, updatedAt: now })
      .where(eq(pointDeVente.id, pointId))

    revalidatePath("/dashboard/vendeur/mes-bouteilles")
    revalidatePath("/dashboard/vendeur")
    return {
      ok: true,
      message: "Bouteille enregistrée avec succès.",
      bottle: { id, brand: normalizeBrandName(brandName), format: normalizeFormat(format), quantity },
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la bouteille.",
    }
  }
}

/** Met à jour une bouteille existante (marque, grammage, quantité). */
export async function updateBottle(
  _prev: BottleActionResult | null,
  formData: FormData
): Promise<BottleActionResult> {
  try {
    const { user } = await requirePro()

    const bottleId = String(formData.get("bottleId") ?? "").trim()
    const pointId = String(formData.get("pointId") ?? "").trim()
    const brandName = String(formData.get("brand") ?? "").trim()
    const format = String(formData.get("format") ?? "").trim()
    const quantityRaw = String(formData.get("quantity") ?? "0").trim()

    if (!bottleId) {
      return { ok: false, message: "Bouteille introuvable." }
    }
    if (!pointId) {
      return { ok: false, message: "Point de vente introuvable." }
    }
    if (!brandName) {
      return { ok: false, message: "La marque de la bouteille est requise." }
    }
    if (!format) {
      return { ok: false, message: "Le grammage de la bouteille est requis." }
    }

    await requireVendorPoint(user.id, pointId)

    // Vérifier que la bouteille appartient bien au point de vente du vendeur.
    const [bottle] = await db
      .select({ id: pointDeVenteBouteille.id, pointDeVenteId: pointDeVenteBouteille.pointDeVenteId })
      .from(pointDeVenteBouteille)
      .where(eq(pointDeVenteBouteille.id, bottleId))
      .limit(1)
    if (!bottle) {
      return { ok: false, message: "Bouteille introuvable." }
    }
    if (bottle.pointDeVenteId !== pointId) {
      return { ok: false, message: "Cette bouteille n'appartient pas à ce point de vente." }
    }

    const brandId = await resolveOrCreateBrandId(brandName)
    const quantity = Number.parseInt(quantityRaw, 10) || 0
    if (quantity < 0) {
      return { ok: false, message: "La quantité doit être un nombre positif ou nul." }
    }

    const normalizedFormat = normalizeFormat(format)
    const normalizedBrand = normalizeBrandName(brandName)
    const now = new Date()

    // Vérifier le doublon sur une autre ligne (marque + format identique sur une autre bouteille du même point).
    const [duplicate] = await db
      .select({ id: pointDeVenteBouteille.id })
      .from(pointDeVenteBouteille)
      .where(
        and(
          eq(pointDeVenteBouteille.pointDeVenteId, pointId),
          eq(pointDeVenteBouteille.brandId, brandId),
          eq(pointDeVenteBouteille.format, normalizedFormat)
        )
      )
      .limit(1)
    if (duplicate && duplicate.id !== bottleId) {
      return {
        ok: false,
        message: `La combinaison « ${brandName} — ${format} » est déjà enregistrée pour ce point de vente.`,
      }
    }

    await db
      .update(pointDeVenteBouteille)
      .set({
        brandId,
        format: normalizedFormat,
        quantity,
        updatedAt: now,
      })
      .where(eq(pointDeVenteBouteille.id, bottleId))

    // Mettre à jour la liste des marques du point de vente.
    const [updatedPoint] = await db
      .select({ brands: pointDeVente.brands })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, pointId))
      .limit(1)
    const currentBrands: string[] = Array.isArray(updatedPoint?.brands) ? updatedPoint.brands : []
    if (!currentBrands.includes(normalizedBrand)) {
      const newBrands = dedupeBrands([...currentBrands, normalizedBrand])
      await db
        .update(pointDeVente)
        .set({ brands: newBrands, updatedAt: now })
        .where(eq(pointDeVente.id, pointId))
    }

    revalidatePath("/dashboard/vendeur/mes-bouteilles")
    revalidatePath("/dashboard/vendeur")
    return {
      ok: true,
      message: "Bouteille modifiée avec succès.",
      bottle: { id: bottleId, brand: normalizedBrand, format: normalizedFormat, quantity },
    }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de modifier la bouteille.",
    }
  }
}

/** Supprime une bouteille d'un point de vente. */
export async function deleteBottle(
  _prev: BottleActionResult | null,
  formData: FormData
): Promise<BottleActionResult> {
  try {
    const { user } = await requirePro()

    const bottleId = String(formData.get("bottleId") ?? "").trim()
    const pointId = String(formData.get("pointId") ?? "").trim()

    if (!bottleId) {
      return { ok: false, message: "Bouteille introuvable." }
    }
    if (!pointId) {
      return { ok: false, message: "Point de vente introuvable." }
    }

    await requireVendorPoint(user.id, pointId)

    const [bottle] = await db
      .select({ id: pointDeVenteBouteille.id, pointDeVenteId: pointDeVenteBouteille.pointDeVenteId })
      .from(pointDeVenteBouteille)
      .where(eq(pointDeVenteBouteille.id, bottleId))
      .limit(1)
    if (!bottle) {
      return { ok: false, message: "Bouteille introuvable." }
    }
    if (bottle.pointDeVenteId !== pointId) {
      return { ok: false, message: "Cette bouteille n'appartient pas à ce point de vente." }
    }

    await db.delete(pointDeVenteBouteille).where(eq(pointDeVenteBouteille.id, bottleId))

    revalidatePath("/dashboard/vendeur/mes-bouteilles")
    revalidatePath("/dashboard/vendeur")
    return { ok: true, message: "Bouteille supprimée avec succès." }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible de supprimer la bouteille.",
    }
  }
}

/** Récupère les bouteilles d'un point de vente avec le nom de la marque. */
export async function getBottlesForPoint(pointId: string) {
  const bottles = await db
    .select({
      id: pointDeVenteBouteille.id,
      brandId: pointDeVenteBouteille.brandId,
      format: pointDeVenteBouteille.format,
      quantity: pointDeVenteBouteille.quantity,
      brand: brand.name,
    })
    .from(pointDeVenteBouteille)
    .innerJoin(brand, eq(pointDeVenteBouteille.brandId, brand.id))
    .where(eq(pointDeVenteBouteille.pointDeVenteId, pointId))
    .orderBy(brand.name)
  return bottles
}

/** Met à jour la configuration des services d'un point de vente. */
export type ServiceConfigResult = {
  ok: boolean
  message: string
}

export async function updatePointServices(
  _prev: ServiceConfigResult | null,
  formData: FormData
): Promise<ServiceConfigResult> {
  try {
    const { user } = await requirePro()

    const pointId = String(formData.get("pointId") ?? "").trim()
    if (!pointId) {
      return { ok: false, message: "Point de vente introuvable." }
    }

    await requireVendorPoint(user.id, pointId)

    const deliveryEnabled = formData.get("deliveryEnabled") === "on"
    const deliveryFeeRaw = String(formData.get("deliveryFee") ?? "0").trim()
    const exchangeEnabled = formData.get("exchangeEnabled") === "on"
    const exchangeBrandsRaw = String(formData.get("exchangeBrands") ?? "").trim()
    const exchangeFormatsRaw = String(formData.get("exchangeFormats") ?? "").trim()
    const gasSaleEnabled = formData.get("gasSaleEnabled") === "on"

    const deliveryFee = Number.parseInt(deliveryFeeRaw, 10) || 0
    if (deliveryFee < 0) {
      return { ok: false, message: "Les frais de livraison doivent être un nombre positif ou nul." }
    }

    const exchangeBrands = exchangeBrandsRaw
      .split(",")
      .map((b) => b.trim())
      .filter(Boolean)
    const exchangeFormats = exchangeFormatsRaw
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean)

    const now = new Date()
    await db
      .update(pointDeVente)
      .set({
        deliveryEnabled,
        deliveryFee,
        exchangeEnabled,
        exchangeBrands,
        exchangeFormats,
        gasSaleEnabled,
        updatedAt: now,
      })
      .where(eq(pointDeVente.id, pointId))

    revalidatePath("/dashboard/vendeur/mes-services")
    revalidatePath("/dashboard/vendeur")
    return { ok: true, message: "Configuration des services enregistrée avec succès." }
  } catch (error) {
    return {
      ok: false,
      message:
        error instanceof Error
          ? error.message
          : "Impossible d'enregistrer la configuration des services.",
    }
  }
}
