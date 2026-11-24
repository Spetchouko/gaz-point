import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { pointDeVente } from "@/db/schema"
import { getProUser } from "@/lib/session"
import {
  MAX_VENDOR_BRANDS,
  MAX_VENDOR_FORMATS,
  cleanCatalogValues,
} from "@/lib/vendor-catalog"
import {
  filterSupportedDepotFields,
  getDepotRowById,
} from "@/lib/vendor-depot-compat"

type DepotPatchBody = {
  name?: unknown
  district?: unknown
  address?: unknown
  phone?: unknown
  latitude?: unknown
  longitude?: unknown
  brands?: unknown
  formats?: unknown
  deliveryEnabled?: unknown
  deliveryFee?: unknown
  exchangeEnabled?: unknown
  exchangeFee?: unknown
  exchangeBrands?: unknown
  exchangeFormats?: unknown
  gasSaleEnabled?: unknown
  gasSaleFee?: unknown
  gasSaleBrands?: unknown
  gasSaleFormats?: unknown
}

function cleanText(value: unknown, max: number): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null) return null
  if (typeof value !== "string") return undefined
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

function cleanCoordinate(value: unknown): string | null | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isFinite(numeric) || numeric < -180 || numeric > 180) {
    return undefined
  }
  return String(numeric)
}

function parseRequiredFee(value: unknown): number | null | undefined {
  if (value === undefined) return undefined
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 10_000_000) {
    return null
  }
  return numeric
}

function parseOptionalFeeStrict(value: unknown): number | null | "invalid" | undefined {
  if (value === undefined) return undefined
  if (value === null || value === "") return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 10_000_000) {
    return "invalid"
  }
  return numeric
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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
    const body = (await req.json().catch(() => null)) as DepotPatchBody | null
    if (!body) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
    }

    const point = await getDepotRowById(id)

    if (!point || point.vendorId !== user.id) {
      return NextResponse.json({ error: "Dépôt introuvable" }, { status: 404 })
    }

    const name = cleanText(body.name, 100)
    const district = cleanText(body.district, 100)
    const address = cleanText(body.address, 200)
    const phone = cleanText(body.phone, 30)
    const latitude = cleanCoordinate(body.latitude)
    const longitude = cleanCoordinate(body.longitude)

    // On construit d'abord un jeu de champs élargi : le schéma Drizzle ne
    // contient pas les colonnes GPS, mais l'API les accepte pour rester
    // compatible si elles sont migrées plus tard. filterSupportedDepotFields
    // retire les champs absents de Neon avant l'écriture.
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    }

    if (name !== undefined) updates.name = name ?? undefined
    if (district !== undefined) updates.district = district ?? undefined
    if (address !== undefined) updates.address = address ?? undefined
    if (phone !== undefined) updates.phone = phone
    if (latitude !== undefined) updates.latitude = latitude
    if (longitude !== undefined) updates.longitude = longitude

    if (body.brands !== undefined) {
      const brands = cleanCatalogValues(body.brands, MAX_VENDOR_BRANDS).filter(
        (brand) => brand.length <= 50
      )
      if (brands.length === 0) {
        return NextResponse.json(
          { error: "Sélectionnez au moins une marque" },
          { status: 400 }
        )
      }
      updates.brands = brands
    }

    if (body.formats !== undefined) {
      const formats = cleanCatalogValues(body.formats, MAX_VENDOR_FORMATS).filter(
        (format) => format.length <= 30
      )
      if (formats.length === 0) {
        return NextResponse.json(
          { error: "Sélectionnez au moins un grammage" },
          { status: 400 }
        )
      }
      updates.formats = formats
    }

    if ([name, district, address].some((value) => value === null)) {
      return NextResponse.json(
        { error: "Le nom, le quartier et l'adresse sont obligatoires" },
        { status: 400 }
      )
    }
    if (
      (body.latitude !== undefined && latitude === undefined) ||
      (body.longitude !== undefined && longitude === undefined)
    ) {
      return NextResponse.json(
        { error: "Les coordonnées GPS sont invalides" },
        { status: 400 }
      )
    }

    if (typeof body.deliveryEnabled === "boolean") updates.deliveryEnabled = body.deliveryEnabled
    if (typeof body.exchangeEnabled === "boolean") updates.exchangeEnabled = body.exchangeEnabled
    if (typeof body.gasSaleEnabled === "boolean") updates.gasSaleEnabled = body.gasSaleEnabled

    const deliveryFee = parseRequiredFee(body.deliveryFee)
    if (body.deliveryFee !== undefined && deliveryFee === null) {
      return NextResponse.json({ error: "Les frais de livraison sont invalides" }, { status: 400 })
    }
    if (deliveryFee != null) updates.deliveryFee = deliveryFee

    const exchangeFee = parseOptionalFeeStrict(body.exchangeFee)
    if (exchangeFee === "invalid") {
      return NextResponse.json({ error: "Le prix du service d'échange est invalide" }, { status: 400 })
    }
    if (exchangeFee !== undefined) updates.exchangeFee = exchangeFee

    const gasSaleFee = parseOptionalFeeStrict(body.gasSaleFee)
    if (gasSaleFee === "invalid") {
      return NextResponse.json({ error: "Le prix du service de vente de gaz est invalide" }, { status: 400 })
    }
    if (gasSaleFee !== undefined) updates.gasSaleFee = gasSaleFee

    if (body.exchangeBrands !== undefined) {
      updates.exchangeBrands = cleanCatalogValues(body.exchangeBrands, MAX_VENDOR_BRANDS).filter(
        (brand) => brand.length <= 50
      )
    }
    if (body.exchangeFormats !== undefined) {
      updates.exchangeFormats = cleanCatalogValues(body.exchangeFormats, MAX_VENDOR_FORMATS).filter(
        (format) => format.length <= 30
      )
    }
    if (body.gasSaleBrands !== undefined) {
      updates.gasSaleBrands = cleanCatalogValues(body.gasSaleBrands, MAX_VENDOR_BRANDS).filter(
        (brand) => brand.length <= 50
      )
    }
    if (body.gasSaleFormats !== undefined) {
      updates.gasSaleFormats = cleanCatalogValues(body.gasSaleFormats, MAX_VENDOR_FORMATS).filter(
        (format) => format.length <= 30
      )
    }

    const finalDeliveryEnabled = updates.deliveryEnabled ?? undefined
    const finalExchangeEnabled = updates.exchangeEnabled ?? undefined
    const finalGasSaleEnabled = updates.gasSaleEnabled ?? undefined
    if (finalDeliveryEnabled === false) updates.deliveryFee = 0
    if (finalExchangeEnabled === false) {
      updates.exchangeFee = null
      if (body.exchangeBrands === undefined) updates.exchangeBrands = []
      if (body.exchangeFormats === undefined) updates.exchangeFormats = []
    }
    if (finalGasSaleEnabled === false) {
      updates.gasSaleFee = null
      if (body.gasSaleBrands === undefined) updates.gasSaleBrands = []
      if (body.gasSaleFormats === undefined) updates.gasSaleFormats = []
    }

    // Certaines colonnes du schéma Drizzle ne sont pas migrées dans Neon :
    // on n'écrit que celles qui existent réellement, puis on relit la ligne.
    const safeUpdates = await filterSupportedDepotFields(updates)
    await db
      .update(pointDeVente)
      .set(safeUpdates as Partial<typeof pointDeVente.$inferInsert>)
      .where(eq(pointDeVente.id, id))

    const updated = await getDepotRowById(id)
    return NextResponse.json({ point: updated })
  } catch (err) {
    console.error("[depot/patch] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du dépôt" },
      { status: 500 }
    )
  }
}
