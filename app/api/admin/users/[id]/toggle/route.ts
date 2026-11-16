import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { user } from "@/db/schema"
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

    // Vérifier que l'utilisateur existe
    const [existing] = await db
      .select({ id: user.id, role: user.role, isActive: user.isActive })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    // Empêcher l'admin de se désactiver lui-même
    if (existing.id === admin.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas désactiver votre propre compte" },
        { status: 400 }
      )
    }

    await db
      .update(user)
      .set({ isActive: body.isActive, updatedAt: new Date() })
      .where(eq(user.id, id))

    return NextResponse.json({
      ok: true,
      message: `Compte ${body.isActive ? "réactivé" : "suspendu"} avec succès`,
    })
  } catch (err) {
    console.error("[admin/users/toggle] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la modification du compte" },
      { status: 500 }
    )
  }
}
