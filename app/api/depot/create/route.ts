import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { pointDeVente, vendorOnboarding } from "@/db/schema"
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

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
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

function parseRequiredFee(value: unknown, fallback = 0): number | null {
  if (value === undefined || value === null || value === "") return fallback
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 10_000_000) {
    return null
  }
  return numeric
}

function parseOptionalFee(value: unknown): number | null | "invalid" {
  if (value === undefined || value === null || value === "") return null
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 10_000_000) {
    return "invalid"
  }
  return numeric
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as {
      name?: string
      district?: string
      address?: string
      phone?: string
      latitude?: unknown
      longitude?: unknown
      brands?: string[]
      formats?: string[]
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
    } | null

    if (!body) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
    }

    const name = cleanText(body.name, 100)
    const district = cleanText(body.district, 100)
    const address = cleanText(body.address, 200)
    const phone = cleanText(body.phone, 30)
    const latitude = cleanCoordinate(body.latitude)
    const longitude = cleanCoordinate(body.longitude)

    if (
      (body.latitude !== undefined && latitude === undefined) ||
      (body.longitude !== undefined && longitude === undefined)
    ) {
      return NextResponse.json(
        { error: "Les coordonnées GPS sont invalides" },
        { status: 400 }
      )
    }

    if (!name || !district || !address) {
      return NextResponse.json(
        { error: "Le nom, le quartier et l'adresse sont obligatoires" },
        { status: 400 }
      )
    }

    const brands = cleanCatalogValues(body.brands, MAX_VENDOR_BRANDS).filter(
      (brand) => brand.length <= 50
    )
    const formats = cleanCatalogValues(body.formats, MAX_VENDOR_FORMATS).filter(
      (format) => format.length <= 30
    )

    if (brands.length === 0) {
      return NextResponse.json(
        { error: "Sélectionnez au moins une marque" },
        { status: 400 }
      )
    }
    if (formats.length === 0) {
      return NextResponse.json(
        { error: "Sélectionnez au moins un grammage" },
        { status: 400 }
      )
    }

    const deliveryEnabled = typeof body.deliveryEnabled === "boolean" ? body.deliveryEnabled : false
    const exchangeEnabled = typeof body.exchangeEnabled === "boolean" ? body.exchangeEnabled : false
    const gasSaleEnabled = typeof body.gasSaleEnabled === "boolean" ? body.gasSaleEnabled : false

    const deliveryFee = parseRequiredFee(body.deliveryFee, 0)
    if (deliveryFee === null) {
      return NextResponse.json({ error: "Les frais de livraison sont invalides" }, { status: 400 })
    }
    const exchangeFee = parseOptionalFee(body.exchangeFee)
    if (exchangeFee === "invalid") {
      return NextResponse.json({ error: "Le prix du service d'échange est invalide" }, { status: 400 })
    }
    const gasSaleFee = parseOptionalFee(body.gasSaleFee)
    if (gasSaleFee === "invalid") {
      return NextResponse.json({ error: "Le prix du service de vente de gaz est invalide" }, { status: 400 })
    }

    const exchangeBrands = cleanCatalogValues(body.exchangeBrands, MAX_VENDOR_BRANDS).filter(
      (brand) => brand.length <= 50
    )
    const exchangeFormats = cleanCatalogValues(body.exchangeFormats, MAX_VENDOR_FORMATS).filter(
      (format) => format.length <= 30
    )
    const gasSaleBrands = cleanCatalogValues(body.gasSaleBrands, MAX_VENDOR_BRANDS).filter(
      (brand) => brand.length <= 50
    )
    const gasSaleFormats = cleanCatalogValues(body.gasSaleFormats, MAX_VENDOR_FORMATS).filter(
      (format) => format.length <= 30
    )

    // Allow multiple depots per vendor - no limit check

    const pointId = randomUUID()
    const now = new Date()

    const depotValues = await filterSupportedDepotFields({
      id: pointId,
      name,
      district,
      address,
      phone,
      latitude,
      longitude,
      brands,
      formats,
      deliveryEnabled,
      deliveryFee: deliveryEnabled ? deliveryFee : 0,
      exchangeEnabled,
      exchangeFee: exchangeEnabled ? exchangeFee : null,
      exchangeBrands: exchangeEnabled ? exchangeBrands : [],
      exchangeFormats: exchangeEnabled ? exchangeFormats : [],
      gasSaleEnabled,
      gasSaleFee: gasSaleEnabled ? gasSaleFee : null,
      gasSaleBrands: gasSaleEnabled ? gasSaleBrands : [],
      gasSaleFormats: gasSaleEnabled ? gasSaleFormats : [],
      vendorId: user.id,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })

    // Le driver node-postgres n'expose pas db.batch() (contrairement au driver
    // Neon HTTP). La transaction garantit la même atomicité : soit le dépôt et
    // l'onboarding sont enregistrés, soit aucun des deux.
    await db.transaction(async (tx) => {
      await tx
        .insert(pointDeVente)
        .values(depotValues as typeof pointDeVente.$inferInsert)
      await tx
        .update(vendorOnboarding)
        .set({
          status: "completed",
          pointDeVenteId: pointId,
          pointName: name,
          district,
          address,
          phone,
          brands,
          updatedAt: now,
        })
        .where(eq(vendorOnboarding.userId, user.id))
    })

    const point = await getDepotRowById(pointId)

    return NextResponse.json({ point }, { status: 201 })
  } catch (err) {
    console.error("[depot/create] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la création du dépôt" },
      { status: 500 }
    )
  }
}
