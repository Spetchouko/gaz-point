import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { pointDeVente } from "@/db/schema"
import { getProUser } from "@/lib/session"

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

    // Vérifie qu'il n'existe pas déjà un dépôt pour ce vendeur
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

    const brands = Array.isArray(body.brands) ? body.brands.filter(Boolean) : []
    const formats = Array.isArray(body.formats) ? body.formats.filter(Boolean) : []

    const [point] = await db
      .insert(pointDeVente)
      .values({
        name,
        district,
        address,
        phone,
        brands,
        formats,
        vendorId: user.id,
        isActive: true,
      })
      .returning()

    return NextResponse.json({ point }, { status: 201 })
  } catch (err) {
    console.error("[depot/create] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la création du dépôt" },
      { status: 500 }
    )
  }
}
