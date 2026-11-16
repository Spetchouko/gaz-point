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

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
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
      brands?: string[]
      formats?: string[]
    } | null

    if (!body) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
    }

    const name = cleanText(body.name, 100)
    const district = cleanText(body.district, 100)
    const address = cleanText(body.address, 200)
    const phone = cleanText(body.phone, 30)

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

    const [existing] = await db
      .select({ id: pointDeVente.id })
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, user.id))
      .limit(1)
    if (existing) {
      return NextResponse.json(
        { error: "Un dépôt est déjà créé pour ce compte" },
        { status: 400 }
      )
    }

    const pointId = randomUUID()
    const now = new Date()

    // Neon exécute ce lot dans une transaction. Le dépôt et la clôture du
    // brouillon d'onboarding sont donc enregistrés ensemble.
    await db.batch([
      db.insert(pointDeVente).values({
        id: pointId,
        name,
        district,
        address,
        phone,
        brands,
        formats,
        vendorId: user.id,
        isActive: true,
        createdAt: now,
        updatedAt: now,
      }),
      db
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
        .where(eq(vendorOnboarding.userId, user.id)),
    ])

    const [point] = await db
      .select()
      .from(pointDeVente)
      .where(eq(pointDeVente.id, pointId))
      .limit(1)

    return NextResponse.json({ point }, { status: 201 })
  } catch (err) {
    console.error("[depot/create] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la création du dépôt" },
      { status: 500 }
    )
  }
}
