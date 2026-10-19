import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, disponibilite } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { getCurrentUser } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
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

    // Le driver neon-http ne supporte pas db.transaction(). L'UPDATE
    // conditionnel garantit qu'une réservation ne peut être annulée qu'une
    // seule fois, donc que le stock n'est libéré qu'une seule fois.
    const [cancelled] = await db
      .update(reservation)
      .set({
        status: "cancelled",
        cancelledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(reservation.id, res.id), eq(reservation.status, "confirmed")))
      .returning({ id: reservation.id })

    if (!cancelled) {
      return NextResponse.json({ error: "Réservation déjà annulée" }, { status: 400 })
    }

    if (res.disponibiliteId) {
      await db
        .update(disponibilite)
        .set({
          reservedQuantity: sql`GREATEST(0, ${disponibilite.reservedQuantity} - ${res.quantity})`,
          updatedAt: new Date(),
        })
        .where(eq(disponibilite.id, res.disponibiliteId))
    }

    return NextResponse.json({ ok: true, message: "Réservation annulée" })
  } catch (err) {
    console.error("[reservation/cancel] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de l'annulation" },
      { status: 500 }
    )
  }
}
