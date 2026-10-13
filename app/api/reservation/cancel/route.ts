import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, disponibilite } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireUser } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser()
    const body = (await req.json().catch(() => null)) as { reservationId?: string } | null

    if (!body?.reservationId) {
      return NextResponse.json({ error: "ID de réservation requis" }, { status: 400 })
    }

    const [res] = await db
      .select({
        id: reservation.id,
        userId: reservation.userId,
        disponibiliteId: reservation.disponibiliteId,
        quantity: reservation.quantity,
        status: reservation.status,
      })
      .from(reservation)
      .where(eq(reservation.id, body.reservationId))
      .limit(1)

    if (!res) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    if (res.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "Non autorisé à annuler cette réservation" },
        { status: 403 }
      )
    }

    if (res.status === "collected") {
      return NextResponse.json(
        { error: "Impossible d'annuler une réservation déjà retirée" },
        { status: 400 }
      )
    }

    if (res.status === "cancelled") {
      return NextResponse.json({ error: "Réservation déjà annulée" }, { status: 400 })
    }

    // Release reserved quantity
    await db.transaction(async (tx) => {
      await tx
        .update(reservation)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(reservation.id, res.id))

      if (res.disponibiliteId) {
        const [dispo] = await tx
          .select({ reservedQuantity: disponibilite.reservedQuantity })
          .from(disponibilite)
          .where(eq(disponibilite.id, res.disponibiliteId!))
          .limit(1)

        if (dispo) {
          const newReserved = Math.max(0, (dispo.reservedQuantity ?? 0) - res.quantity)
          await tx
            .update(disponibilite)
            .set({
              reservedQuantity: newReserved,
              updatedAt: new Date(),
            })
            .where(eq(disponibilite.id, res.disponibiliteId!))
        }
      }
    })

    return NextResponse.json({ ok: true, message: "Réservation annulée" })
  } catch (err) {
    console.error("[reservation/cancel] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de l'annulation" },
      { status: 500 }
    )
  }
}