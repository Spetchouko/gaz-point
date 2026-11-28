import { NextRequest, NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { pointDeVente } from "@/db/schema"
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

    // Verify ownership
    const [point] = await db
      .select({ id: pointDeVente.id, isActive: pointDeVente.isActive, vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, id))
      .limit(1)

    if (!point || point.vendorId !== user.id) {
      return NextResponse.json({ error: "Dépôt introuvable" }, { status: 404 })
    }

    const body = (await req.json().catch(() => null)) as { isActive?: boolean } | null
    if (!body || typeof body.isActive !== "boolean") {
      return NextResponse.json({ error: "isActive booléen requis" }, { status: 400 })
    }

    const newIsActive = body.isActive

    await db
      .update(pointDeVente)
      .set({ isActive: newIsActive, updatedAt: new Date() })
      .where(eq(pointDeVente.id, id))

    const updated = await db
      .select()
      .from(pointDeVente)
      .where(eq(pointDeVente.id, id))
      .limit(1)

    return NextResponse.json({ point: updated[0] })
  } catch (err) {
    console.error("[depot/toggle] error:", err)
    return NextResponse.json(
      { error: "Erreur lors du changement de statut" },
      { status: 500 }
    )
  }
}