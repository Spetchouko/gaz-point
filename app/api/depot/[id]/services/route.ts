import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { pointDeVente } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getProUser } from "@/lib/session"

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
    const body = (await req.json().catch(() => null)) as {
      deliveryEnabled?: boolean
      exchangeEnabled?: boolean
      gasSaleEnabled?: boolean
    } | null

    if (!body) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
    }

    // Vérifie que le dépôt appartient au vendeur
    const [point] = await db
      .select({ id: pointDeVente.id, vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, id))
      .limit(1)

    if (!point) {
      return NextResponse.json({ error: "Dépôt introuvable" }, { status: 404 })
    }
    if (point.vendorId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const [updated] = await db
      .update(pointDeVente)
      .set({
        deliveryEnabled: body.deliveryEnabled ?? false,
        exchangeEnabled: body.exchangeEnabled ?? false,
        gasSaleEnabled: body.gasSaleEnabled ?? false,
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
