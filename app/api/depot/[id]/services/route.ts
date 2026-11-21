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

type ServicesPatchBody = {
  deliveryEnabled?: unknown
  exchangeEnabled?: unknown
  gasSaleEnabled?: unknown
  deliveryFee?: unknown
  exchangeBrands?: unknown
  exchangeFormats?: unknown
}

function parseFee(value: unknown, fallback: number): number | null {
  if (value === undefined) return fallback
  const numeric = typeof value === "number" ? value : Number(value)
  if (!Number.isInteger(numeric) || numeric < 0 || numeric > 10_000_000) {
    return null
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
    const body = (await req.json().catch(() => null)) as ServicesPatchBody | null
    if (!body) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
    }

    const [point] = await db
      .select()
      .from(pointDeVente)
      .where(eq(pointDeVente.id, id))
      .limit(1)

    if (!point || point.vendorId !== user.id) {
      return NextResponse.json({ error: "Dépôt introuvable" }, { status: 404 })
    }

    const deliveryFee = parseFee(body.deliveryFee, point.deliveryFee)
    if (deliveryFee === null) {
      return NextResponse.json(
        { error: "Les frais de livraison sont invalides" },
        { status: 400 }
      )
    }

    const exchangeBrands = body.exchangeBrands
      ? cleanCatalogValues(body.exchangeBrands, MAX_VENDOR_BRANDS).filter(
          (brand) => brand.length <= 50
        )
      : point.exchangeBrands ?? []

    const exchangeFormats = body.exchangeFormats
      ? cleanCatalogValues(body.exchangeFormats, MAX_VENDOR_FORMATS).filter(
          (format) => format.length <= 30
        )
      : point.exchangeFormats ?? []

    const [updated] = await db
      .update(pointDeVente)
      .set({
        deliveryEnabled:
          typeof body.deliveryEnabled === "boolean"
            ? body.deliveryEnabled
            : point.deliveryEnabled,
        exchangeEnabled:
          typeof body.exchangeEnabled === "boolean"
            ? body.exchangeEnabled
            : point.exchangeEnabled,
        gasSaleEnabled:
          typeof body.gasSaleEnabled === "boolean"
            ? body.gasSaleEnabled
            : point.gasSaleEnabled,
        deliveryFee,
        exchangeBrands,
        exchangeFormats,
        updatedAt: new Date(),
      })
      .where(eq(pointDeVente.id, id))
      .returning()

    return NextResponse.json({ point: updated })
  } catch (err) {
    console.error("[depot/services] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour des services" },
      { status: 500 }
    )
  }
}
