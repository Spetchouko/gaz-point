import { randomUUID } from "node:crypto"
import { and, eq, ilike, notInArray } from "drizzle-orm"
import { db } from "@/db"
import {
  brand,
  pointDeVente,
  pointDeVenteBouteille,
  vendorOnboarding,
} from "@/db/schema"
import {
  brandKey,
  dedupeBrands,
  normalizeBrandName,
  normalizeFormat,
  sanitizeInventoryDraft,
  validateInventoryForFinalization,
  validatePointInfo,
  type VendorInventoryEntry,
  type VendorInventoryReference,
  type VendorPointInfo,
} from "@/lib/vendor-onboarding"

/**
 * Couche métier du parcours vendeur.
 *
 * Elle ne dépend ni de la session ni de Next.js : les actions serveur y
 * ajoutent l'authentification et l'invalidation du cache. Cela permet aussi
 * de tester le parcours réellement contre la base sans passer par l'interface.
 */

export async function getVendorOnboarding(userId: string) {
  const [row] = await db
    .select()
    .from(vendorOnboarding)
    .where(eq(vendorOnboarding.userId, userId))
    .limit(1)
  return row ?? null
}

/**
 * Enregistre (ou met à jour) les informations du dépôt.
 * Les marques et l'inventaire déjà sauvegardés ne sont jamais écrasés ici.
 */
export async function savePointInfoForUser(
  userId: string,
  input: {
    pointName?: unknown
    district?: unknown
    address?: unknown
    phone?: unknown
  }
): Promise<VendorPointInfo> {
  const pointInfo = validatePointInfo(input)
  const now = new Date()

  await db
    .insert(vendorOnboarding)
    .values({
      id: randomUUID(),
      userId,
      pointName: pointInfo.pointName,
      district: pointInfo.district,
      address: pointInfo.address,
      phone: pointInfo.phone,
      brands: [],
      inventory: [],
      status: "draft",
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: vendorOnboarding.userId,
      set: {
        pointName: pointInfo.pointName,
        district: pointInfo.district,
        address: pointInfo.address,
        phone: pointInfo.phone,
        updatedAt: now,
      },
    })

  return pointInfo
}

/**
 * Sauvegarde progressive de l'inventaire (étape 2), y compris les lignes
 * partiellement remplies, afin de reprendre le parcours après une interruption.
 */
export async function saveInventoryDraftForUser(
  userId: string,
  inventory: unknown
): Promise<VendorInventoryEntry[]> {
  const onboarding = await getVendorOnboarding(userId)
  if (!onboarding) {
    throw new Error(
      "Complétez d'abord les informations de votre point de vente."
    )
  }

  const draft = sanitizeInventoryDraft(inventory)
  const brands = dedupeBrands(draft.map((entry) => entry.brand))

  await db
    .update(vendorOnboarding)
    .set({ inventory: draft, brands, updatedAt: new Date() })
    .where(eq(vendorOnboarding.userId, userId))

  return draft
}

/**
 * Crée ou met à jour le point de vente du vendeur, puis synchronise ses
 * références de bouteilles. Idempotent : relancer le parcours met à jour le
 * point déjà rattaché au brouillon au lieu d'en créer un second.
 */
export async function finalizePointForUser(
  userId: string,
  input: {
    point: {
      pointName?: unknown
      district?: unknown
      address?: unknown
      phone?: unknown
    }
    inventory: unknown
  }
): Promise<{ pointId: string; created: boolean }> {
  const pointInfo = validatePointInfo(input.point)
  const references = validateInventoryForFinalization(input.inventory)
  const onboarding = await getVendorOnboarding(userId)

  let pointId = onboarding?.pointDeVenteId ?? null
  if (pointId) {
    const [owned] = await db
      .select({ id: pointDeVente.id })
      .from(pointDeVente)
      .where(and(eq(pointDeVente.id, pointId), eq(pointDeVente.vendorId, userId)))
      .limit(1)
    if (!owned) pointId = null
  }

  // Filet de sécurité si l'identifiant du point n'a pas pu être mémorisé lors
  // d'une tentative précédente : on retrouve un point du même vendeur portant
  // le même nom au lieu d'en créer un doublon.
  if (!pointId) {
    const [sameName] = await db
      .select({ id: pointDeVente.id })
      .from(pointDeVente)
      .where(
        and(
          eq(pointDeVente.vendorId, userId),
          ilike(pointDeVente.name, pointInfo.pointName)
        )
      )
      .limit(1)
    pointId = sameName?.id ?? null
  }

  const brands = dedupeBrands(references.map((reference) => reference.brand))
  const formats = Array.from(
    new Set(references.map((reference) => normalizeFormat(reference.format)))
  )
  const now = new Date()
  const created = !pointId

  if (pointId) {
    await db
      .update(pointDeVente)
      .set({
        name: pointInfo.pointName,
        district: pointInfo.district,
        address: pointInfo.address,
        phone: pointInfo.phone,
        brands,
        formats,
        updatedAt: now,
      })
      .where(and(eq(pointDeVente.id, pointId), eq(pointDeVente.vendorId, userId)))
  } else {
    pointId = randomUUID()
    await db.insert(pointDeVente).values({
      id: pointId,
      name: pointInfo.pointName,
      district: pointInfo.district,
      address: pointInfo.address,
      phone: pointInfo.phone,
      brands,
      formats,
      vendorId: userId,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  }

  await syncInventory(pointId, references)

  const inventoryDraft: VendorInventoryEntry[] = references.map((reference) => ({
    brand: reference.brand,
    format: reference.format,
    quantity: reference.quantity,
  }))

  await db
    .insert(vendorOnboarding)
    .values({
      id: randomUUID(),
      userId,
      pointName: pointInfo.pointName,
      district: pointInfo.district,
      address: pointInfo.address,
      phone: pointInfo.phone,
      brands,
      inventory: inventoryDraft,
      status: "completed",
      pointDeVenteId: pointId,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: vendorOnboarding.userId,
      set: {
        pointName: pointInfo.pointName,
        district: pointInfo.district,
        address: pointInfo.address,
        phone: pointInfo.phone,
        brands,
        inventory: inventoryDraft,
        status: "completed",
        pointDeVenteId: pointId,
        updatedAt: now,
      },
    })

  return { pointId, created }
}

async function syncInventory(
  pointId: string,
  references: VendorInventoryReference[]
): Promise<void> {
  const existingRows = await db
    .select({
      id: pointDeVenteBouteille.id,
      brandId: pointDeVenteBouteille.brandId,
      format: pointDeVenteBouteille.format,
    })
    .from(pointDeVenteBouteille)
    .where(eq(pointDeVenteBouteille.pointDeVenteId, pointId))

  const resolvedBrands = new Map<string, string>()
  const keptIds = new Set<string>()

  for (const reference of references) {
    const key = brandKey(reference.brand)
    let brandId = resolvedBrands.get(key)
    if (!brandId) {
      brandId = await resolveBrandId(reference.brand)
      resolvedBrands.set(key, brandId)
    }

    const existing = existingRows.find(
      (row) => row.brandId === brandId && row.format === reference.format
    )

    if (existing) {
      await db
        .update(pointDeVenteBouteille)
        .set({ quantity: reference.quantity, updatedAt: new Date() })
        .where(eq(pointDeVenteBouteille.id, existing.id))
      keptIds.add(existing.id)
      continue
    }

    await db
      .insert(pointDeVenteBouteille)
      .values({
        id: randomUUID(),
        pointDeVenteId: pointId,
        brandId,
        format: reference.format,
        quantity: reference.quantity,
      })
      .onConflictDoUpdate({
        target: [
          pointDeVenteBouteille.pointDeVenteId,
          pointDeVenteBouteille.brandId,
          pointDeVenteBouteille.format,
        ],
        set: {
          quantity: reference.quantity,
          updatedAt: new Date(),
        },
      })

    const [inserted] = await db
      .select({ id: pointDeVenteBouteille.id })
      .from(pointDeVenteBouteille)
      .where(
        and(
          eq(pointDeVenteBouteille.pointDeVenteId, pointId),
          eq(pointDeVenteBouteille.brandId, brandId),
          eq(pointDeVenteBouteille.format, reference.format)
        )
      )
      .limit(1)
    if (inserted) keptIds.add(inserted.id)
  }

  if (keptIds.size > 0) {
    await db
      .delete(pointDeVenteBouteille)
      .where(
        and(
          eq(pointDeVenteBouteille.pointDeVenteId, pointId),
          notInArray(pointDeVenteBouteille.id, Array.from(keptIds))
        )
      )
  } else {
    await db
      .delete(pointDeVenteBouteille)
      .where(eq(pointDeVenteBouteille.pointDeVenteId, pointId))
  }
}

async function resolveBrandId(name: string): Promise<string> {
  const cleaned = normalizeBrandName(name)
  const key = brandKey(cleaned)

  const [existing] = await db
    .select({ id: brand.id })
    .from(brand)
    .where(eq(brand.nameKey, key))
    .limit(1)
  if (existing) return existing.id

  await db
    .insert(brand)
    .values({ id: randomUUID(), name: cleaned, nameKey: key })
    .onConflictDoNothing()

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
