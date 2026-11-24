import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { effectiveStatus, isStale } from "@/lib/gaz"
import { getCurrentUser, getProUser } from "@/lib/session"
import { normalizeCatalogValue } from "@/lib/vendor-catalog"

type AvailabilityPatchBody = {
  status?: unknown
  quantity?: unknown
  price?: unknown
  note?: unknown
  brand?: unknown
  format?: unknown
  phone?: unknown
  expiresAt?: unknown
}

function parseOptionalInteger(value: unknown, max: number): number | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > max) return undefined
  return numeric
}

function parseOptionalText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "string") return undefined
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

function parseOptionalDate(value: unknown): Date | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  const date = new Date(String(value))
  if (Number.isNaN(date.getTime())) return undefined
  return date
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
  }

  const { id } = await params

  const [dispo] = await db
    .select({
      id: disponibilite.id,
      pointId: disponibilite.pointId,
      vendorId: disponibilite.vendorId,
      pointVendorId: pointDeVente.vendorId,
      status: disponibilite.status,
      note: disponibilite.note,
      quantity: disponibilite.quantity,
      reservedQuantity: disponibilite.reservedQuantity,
      price: disponibilite.price,
      format: disponibilite.format,
      brand: disponibilite.brand,
      weightKg: disponibilite.weightKg,
      expiresAt: disponibilite.expiresAt,
      phone: disponibilite.phone,
      reportedByName: disponibilite.reportedByName,
      source: disponibilite.source,
      delivery: disponibilite.delivery,
      exchange: disponibilite.exchange,
      gasSale: disponibilite.gasSale,
      createdAt: disponibilite.createdAt,
      updatedAt: disponibilite.updatedAt,
      pointName: pointDeVente.name,
      pointDistrict: pointDeVente.district,
      pointAddress: pointDeVente.address,
      pointPhone: pointDeVente.phone,
      pointBrands: pointDeVente.brands,
      pointFormats: pointDeVente.formats,
      pointDeliveryEnabled: pointDeVente.deliveryEnabled,
      pointDeliveryFee: pointDeVente.deliveryFee,
      pointExchangeEnabled: pointDeVente.exchangeEnabled,
      pointGasSaleEnabled: pointDeVente.gasSaleEnabled,
      pointIsActive: pointDeVente.isActive,
      // Colonnes non migrées dans Neon (frais d'échange/vente et GPS) :
      // elles ne sont pas sélectionnées pour ne pas faire échouer la requête.
    })
    .from(disponibilite)
    .innerJoin(pointDeVente, eq(disponibilite.pointId, pointDeVente.id))
    .where(eq(disponibilite.id, id))
    .limit(1)

  if (
    !dispo ||
    (currentUser.role === "vendor" &&
      dispo.vendorId !== currentUser.id &&
      dispo.pointVendorId !== currentUser.id)
  ) {
    return NextResponse.json({ error: "Disponibilité introuvable" }, { status: 404 })
  }

  const now = new Date()
  const expired =
    dispo.expiresAt != null && new Date(dispo.expiresAt).getTime() < now.getTime()

  const status = expired
    ? "indisponible"
    : effectiveStatus(dispo.status, dispo.createdAt)

  return NextResponse.json({
    disponibilite: {
      id: dispo.id,
      pointId: dispo.pointId,
      status,
      note: dispo.note,
      quantity: dispo.quantity,
      reservedQuantity: dispo.reservedQuantity,
      availableQuantity:
        dispo.quantity != null && dispo.reservedQuantity != null
          ? Math.max(0, dispo.quantity - dispo.reservedQuantity)
          : null,
      price: dispo.price,
      format: dispo.format,
      brand: dispo.brand,
      weightKg: dispo.weightKg,
      expiresAt: dispo.expiresAt,
      phone: dispo.phone,
      reportedByName: dispo.reportedByName,
      source: dispo.source,
      delivery: dispo.delivery,
      exchange: dispo.exchange,
      gasSale: dispo.gasSale,
      stale: isStale(dispo.createdAt),
      expired,
      disponibiliteId: dispo.id,
      createdAt: dispo.createdAt,
      updatedAt: dispo.updatedAt,
    },
    pointDeVente: {
      id: dispo.pointId,
      name: dispo.pointName,
      district: dispo.pointDistrict,
      address: dispo.pointAddress,
      phone: dispo.pointPhone,
      brands: dispo.pointBrands,
      formats: dispo.pointFormats,
      deliveryEnabled: dispo.pointDeliveryEnabled,
      deliveryFee: dispo.pointDeliveryFee,
      exchangeEnabled: dispo.pointExchangeEnabled,
      // Ces colonnes n'existent pas dans la base déployée : on renvoie une
      // valeur neutre plutôt qu'une requête vouée à l'échec.
      exchangeFee: null,
      gasSaleEnabled: dispo.pointGasSaleEnabled,
      gasSaleFee: null,
      isActive: dispo.pointIsActive,
      // Pas de coordonnées GPS tant que la migration 0011 n'est pas appliquée.
      latitude: null,
      longitude: null,
    },
  })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json().catch(() => null)) as AvailabilityPatchBody | null
    if (!body) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
    }

    const [row] = await db
      .select({
        id: disponibilite.id,
        vendorId: disponibilite.vendorId,
        pointId: disponibilite.pointId,
        brands: pointDeVente.brands,
        formats: pointDeVente.formats,
      })
      .from(disponibilite)
      .innerJoin(pointDeVente, eq(disponibilite.pointId, pointDeVente.id))
      .where(eq(disponibilite.id, id))
      .limit(1)

    if (!row || row.vendorId !== user.id) {
      return NextResponse.json({ error: "Disponibilité introuvable" }, { status: 404 })
    }

    const status = body.status
    if (
      status !== undefined &&
      status !== "disponible" &&
      status !== "indisponible"
    ) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }

    const quantity = parseOptionalInteger(body.quantity, 100_000)
    const price = parseOptionalInteger(body.price, 100_000_000)
    const note = parseOptionalText(body.note, 500)
    const phone = parseOptionalText(body.phone, 30)
    const expiresAt = parseOptionalDate(body.expiresAt)

    const brand = parseOptionalText(body.brand, 50)
    const format = parseOptionalText(body.format, 30)

    const brandKey = brand ? normalizeCatalogValue(brand) : null
    const formatKey = format ? normalizeCatalogValue(format) : null
    const brandAllowed =
      brandKey === null ||
      (row.brands ?? []).some(
        (item) => normalizeCatalogValue(item) === brandKey
      )
    const formatAllowed =
      formatKey === null ||
      (row.formats ?? []).some(
        (item) => normalizeCatalogValue(item) === formatKey
      )

    if (!brandAllowed || !formatAllowed) {
      return NextResponse.json(
        {
          error:
            "Cette marque ou ce grammage ne fait pas partie des références déclarées pour votre dépôt.",
        },
        { status: 400 }
      )
    }

    if (
      quantity === undefined ||
      price === undefined ||
      note === undefined ||
      phone === undefined ||
      expiresAt === undefined ||
      brand === undefined ||
      format === undefined
    ) {
      return NextResponse.json({ error: "Valeur invalide" }, { status: 400 })
    }

    const updates: Partial<typeof disponibilite.$inferInsert> = {
      updatedAt: new Date(),
      vendorId: user.id,
    }
    if (status !== undefined) updates.status = status
    if (quantity !== undefined) updates.quantity = quantity
    if (price !== undefined) updates.price = price
    if (note !== undefined) updates.note = note
    if (phone !== undefined) updates.phone = phone
    if (expiresAt !== undefined) updates.expiresAt = expiresAt
    if (brand !== undefined) updates.brand = brand
    if (format !== undefined) updates.format = format

    const [updated] = await db
      .update(disponibilite)
      .set(updates)
      .where(eq(disponibilite.id, id))
      .returning()

    return NextResponse.json({ disponibilite: updated })
  } catch (err) {
    console.error("[disponibilite/patch] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la disponibilité" },
      { status: 500 }
    )
  }
}
