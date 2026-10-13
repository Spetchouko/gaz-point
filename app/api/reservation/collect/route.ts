import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, disponibilite, pointDeVente } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requirePro } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const { user, role } = await requirePro()
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as { code?: string } | null
    const code = body?.code?.trim().toUpperCase()

    if (!code || code.length !== 12) {
      return NextResponse.json(
        { error: "Code de réservation invalide" },
        { status: 400 }
      )
    }

    const [res] = await db
      .select({
        id: reservation.id,
        vendorId: reservation.vendorId,
        pointId: reservation.pointId,
        disponibiliteId: reservation.disponibiliteId,
        quantity: reservation.quantity,
        status: reservation.status,
        expiresAt: reservation.expiresAt,
      })
      .from(reservation)
      .where(eq(reservation.reservationCode, code))
      .limit(1)

    if (!res) {
      return NextResponse.json(
        { error: "Code de réservation introuvable" },
        { status: 404 }
      )
    }

    // Verify ownership
    if (res.vendorId !== user.id) {
      return NextResponse.json(
        { error: "Cette réservation ne concerne pas votre dépôt" },
        { status: 403 }
      )
    }

    // Check status
    if (res.status === "collected") {
      return NextResponse.json(
        { error: "Cette réservation a déjà été retirée" },
        { status: 400 }
      )
    }

    if (res.status === "cancelled") {
      return NextResponse.json(
        { error: "Cette réservation a été annulée" },
        { status: 400 }
      )
    }

    const isExpired = res.expiresAt && new Date(res.expiresAt) < new Date()
    if (isExpired && res.status === "confirmed") {
      return NextResponse.json(
        { error: "Cette réservation a expiré" },
        { status: 400 }
      )
    }

    // Update reservation status and release reserved quantity
    await db.transaction(async (tx) => {
      // Update reservation
      await tx
        .update(reservation)
        .set({
          status: "collected",
          collectedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reservation.id, res.id))

      // Decrement reserved quantity and actual quantity
      if (res.disponibiliteId) {
        const [dispo] = await tx
          .select({
            quantity: disponibilite.quantity,
            reservedQuantity: disponibilite.reservedQuantity,
          })
          .from(disponibilite)
          .where(eq(disponibilite.id, res.disponibiliteId!))
          .limit(1)

        if (dispo) {
          const newReserved = Math.max(0, (dispo.reservedQuantity ?? 0) - res.quantity)
          const newQuantity = Math.max(0, (dispo.quantity ?? 0) - res.quantity)

          await tx
            .update(disponibilite)
            .set({
              quantity: newQuantity,
              reservedQuantity: newReserved,
              updatedAt: new Date(),
            })
            .where(eq(disponibilite.id, res.disponibiliteId!))
        }
      }
    })

    return NextResponse.json({ ok: true, message: "Retrait confirmé" })
  } catch (err) {
    console.error("[reservation/collect] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la confirmation du retrait" },
      { status: 500 }
    )
  }
}