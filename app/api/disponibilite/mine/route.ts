import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { eq, and, inArray, desc } from "drizzle-orm"
import { getProUser } from "@/lib/session"

export async function GET() {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    // Récupère les points de vente du vendeur
    const points = await db
      .select({ id: pointDeVente.id })
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, user.id))

    const pointIds = points.map((p) => p.id)
    if (pointIds.length === 0) {
      return NextResponse.json({ disponibilites: [] })
    }

    const disponibilites = await db
      .select()
      .from(disponibilite)
      .where(inArray(disponibilite.pointId, pointIds))
      .orderBy(desc(disponibilite.createdAt))

    return NextResponse.json({ disponibilites })
  } catch (err) {
    console.error("[disponibilite/mine] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disponibilités" },
      { status: 500 }
    )
  }
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
      pointId?: string
      brand?: string
      format?: string
      status?: "disponible" | "indisponible"
      quantity?: number
      price?: number
      note?: string
    } | null

    if (!body?.pointId || !body?.brand || !body?.format) {
      return NextResponse.json(
        { error: "Dépôt, marque et format sont requis" },
        { status: 400 }
      )
    }

    // Vérifie que le point appartient au vendeur
    const [point] = await db
      .select({ id: pointDeVente.id, vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, body.pointId))
      .limit(1)

    if (!point || point.vendorId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const [dispo] = await db
      .insert(disponibilite)
      .values({
        pointId: body.pointId,
        vendorId: user.id,
        brand: body.brand,
        format: body.format,
        status: body.status ?? "disponible",
        quantity: body.quantity ?? null,
        price: body.price ?? null,
        note: body.note ?? null,
        source: "vendeur",
        reportedBy: user.id,
        reportedByName: user.name ?? "Vendeur",
      })
      .returning()

    return NextResponse.json({ disponibilite: dispo }, { status: 201 })
  } catch (err) {
    console.error("[disponibilite/create] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la création de la disponibilité" },
      { status: 500 }
    )
  }
}
