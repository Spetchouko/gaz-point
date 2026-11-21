import { NextResponse } from "next/server"
import { db } from "@/db"
import { avis } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("avis")
    if (!staff) {
      return NextResponse.json({ error: "Accès réservé à l'administration" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json()
    const { action } = body // 'approve' | 'reject' | 'hide'

    if (!action || !["approve", "reject", "hide"].includes(action)) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 })
    }

    const statusMap: Record<string, string> = {
      approve: "approved",
      reject: "rejected",
      hide: "hidden",
    }

    const updated = await db
      .update(avis)
      .set({
        status: statusMap[action],
        updatedAt: new Date(),
      })
      .where(eq(avis.id, id))
      .returning({ id: avis.id, status: avis.status })

    if (updated.length === 0) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ avis: updated[0] })
  } catch (err) {
    console.error("[admin/avis/[id]] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de l'avis" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("avis")
    if (!staff) {
      return NextResponse.json({ error: "Accès réservé à l'administration" }, { status: 403 })
    }

    const { id } = await params
    const deleted = await db
      .delete(avis)
      .where(eq(avis.id, id))
      .returning({ id: avis.id })

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("[admin/avis/[id]] delete error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'avis" },
      { status: 500 }
    )
  }
}