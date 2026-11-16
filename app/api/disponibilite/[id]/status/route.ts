import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { disponibilite } from "@/db/schema"
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
      status?: "disponible" | "indisponible"
    } | null

    if (!body?.status) {
      return NextResponse.json({ error: "Statut requis" }, { status: 400 })
    }

    // Vérifie que la disponibilité appartient au vendeur
    const [dispo] = await db
      .select({ id: disponibilite.id, vendorId: disponibilite.vendorId })
      .from(disponibilite)
      .where(eq(disponibilite.id, id))
      .limit(1)

    if (!dispo) {
      return NextResponse.json({ error: "Disponibilité introuvable" }, { status: 404 })
    }
    if (dispo.vendorId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const [updated] = await db
      .update(disponibilite)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(disponibilite.id, id))
      .returning()

    return NextResponse.json({ disponibilite: updated })
  } catch (err) {
    console.error("[disponibilite/status] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour du statut" },
      { status: 500 }
    )
  }
}
