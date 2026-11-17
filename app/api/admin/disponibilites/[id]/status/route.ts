import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { disponibilite, adminAction } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

const VALID_STATUSES = ["disponible", "indisponible", "a_confirmer"] as const

/**
 * PATCH /api/admin/disponibilites/[id]/status
 * Modifie le statut d'une disponibilité publiée.
 */
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
    const body = (await req.json().catch(() => null)) as { status?: string } | null

    if (!body?.status || !VALID_STATUSES.includes(body.status as any)) {
      return NextResponse.json(
        { error: "Statut invalide (disponible, indisponible, a_confirmer)" },
        { status: 400 }
      )
    }

    const [existing] = await db
      .select({ id: disponibilite.id, status: disponibilite.status, brand: disponibilite.brand, format: disponibilite.format })
      .from(disponibilite)
      .where(eq(disponibilite.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Disponibilité introuvable" }, { status: 404 })
    }

    await db
      .update(disponibilite)
      .set({ status: body.status, updatedAt: new Date() })
      .where(eq(disponibilite.id, id))

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "disponibilite",
        targetId: id,
        action: "update",
        details: JSON.stringify({ brand: existing.brand, format: existing.format, status: body.status }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Disponibilité mise à jour avec succès",
      disponibilite: { id, status: body.status },
    })
  } catch (err) {
    console.error("[admin/disponibilites/[id]/status PATCH] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la modification de la disponibilité" },
      { status: 500 }
    )
  }
}
