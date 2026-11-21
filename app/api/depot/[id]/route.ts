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

type DepotPatchBody = {
  name?: unknown
  district?: unknown
  address?: unknown
  phone?: unknown
  latitude?: unknown
  longitude?: unknown
  brands?: unknown
  formats?: unknown
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

    const [point] = await db
      .select({ id: pointDeVente.id, vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, id))
      .limit(1)

    if (!point || point.vendorId !== user.id) {
      return NextResponse.json({ error: "Dépôt introuvable" }, { status: 404 })
    }

    const name = cleanText(body.name, 100)
    const district = cleanText(body.district, 100)
    const address = cleanText(body.address, 200)
    const phone = cleanText(body.phone, 30)
    const latitude = cleanCoordinate(body.latitude)
    const longitude = cleanCoordinate(body.longitude)

    const updates: Partial<typeof pointDeVente.$inferInsert> = {
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

    const [updated] = await db
      .update(pointDeVente)
      .set(updates)
      .where(eq(pointDeVente.id, id))
      .returning()

    return NextResponse.json({ point: updated })
  } catch (err) {
    console.error("[depot/patch] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du dépôt" },
      { status: 500 }
    )
  }
}
