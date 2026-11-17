import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { pointDeVente } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json().catch(() => null)) as { isActive?: boolean } | null

    if (body?.isActive === undefined) {
      return NextResponse.json({ error: "isActive requis" }, { status: 400 })
    }

    // Vérifier que le point de vente existe
    const [existing] = await db
      .select({ id: pointDeVente.id, name: pointDeVente.name, isActive: pointDeVente.isActive })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Point de vente introuvable" }, { status: 404 })
    }

    await db
      .update(pointDeVente)
      .set({ isActive: body.isActive, updatedAt: new Date() })
      .where(eq(pointDeVente.id, id))

    return NextResponse.json({
      ok: true,
      message: `Point de vente ${body.isActive ? "réactivé" : "suspendu"} avec succès`,
    })
  } catch (err) {
    console.error("[admin/points-de-vente/toggle] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la modification du point de vente" },
      { status: 500 }
    )
  }
}
