import { NextRequest, NextResponse } from "next/server"
import { and, eq, sql } from "drizzle-orm"
import { db } from "@/db"
import { disponibilite, pointDeVente, reservation } from "@/db/schema"
import { getCurrentUser } from "@/lib/session"
import { calculateReservationAmount } from "@/lib/reservation-amount"
import {
  buildNotificationLink,
  createNotification,
} from "@/lib/notifications"

const MAX_RESERVATION_QUANTITY = 20

type ReservationRouteContext = {
  params: Promise<{ id: string }>
}

async function getOwnedReservation(reservationId: string, userId: string) {
  const [row] = await db
    .select({
      id: reservation.id,
      userId: reservation.userId,
      pointId: reservation.pointId,
      disponibiliteId: reservation.disponibiliteId,
      reservationCode: reservation.reservationCode,
      brand: reservation.brand,
      format: reservation.format,
      quantity: reservation.quantity,
      amount: reservation.amount,
      status: reservation.status,
      expiresAt: reservation.expiresAt,
    })
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1)

  if (!row || row.userId !== userId) return null
  return row
}

function isExpired(expiresAt: Date | null) {
  return !!expiresAt && expiresAt.getTime() < Date.now()
}

export async function PATCH(req: NextRequest, context: ReservationRouteContext) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: "ID de réservation requis" }, { status: 400 })
    }

    const body = (await req.json().catch(() => null)) as
      | { quantity?: number }
      | null
    const quantity = body?.quantity
    if (!Number.isInteger(quantity) || (quantity as number) < 1) {
      return NextResponse.json(
        { error: "La quantité doit être un entier supérieur à 0" },
        { status: 400 }
      )
    }
    if ((quantity as number) > MAX_RESERVATION_QUANTITY) {
      return NextResponse.json(
        { error: `La quantité maximale par réservation est de ${MAX_RESERVATION_QUANTITY}` },
        { status: 400 }
      )
    }

    const existing = await getOwnedReservation(id, currentUser.id)
    if (!existing) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    if (existing.status !== "confirmed" || isExpired(existing.expiresAt)) {
      return NextResponse.json(
        { error: "Seule une réservation confirmée et non expirée peut être modifiée" },
        { status: 409 }
      )
    }

    const nextQuantity = quantity as number
    const amount = calculateReservationAmount(nextQuantity)
    if (amount === null) {
      return NextResponse.json({ error: "Quantité invalide" }, { status: 400 })
    }

    const delta = nextQuantity - existing.quantity
    if (delta === 0) {
      return NextResponse.json({
        ok: true,
        reservation: {
          id: existing.id,
          quantity: existing.quantity,
          amount: existing.amount,
          status: existing.status,
        },
      })
    }

    // Adjust stock on the linked availability. Neon-http has no transactions,
    // so we use conditional updates and compensate on failure.
    if (delta > 0) {
      if (!existing.disponibiliteId) {
        return NextResponse.json(
          { error: "Stock indisponible pour modifier cette réservation" },
          { status: 409 }
        )
      }

      const [stockUpdated] = await db
        .update(disponibilite)
        .set({
          reservedQuantity: sql`${disponibilite.reservedQuantity} + ${delta}`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(disponibilite.id, existing.disponibiliteId),
            sql`${disponibilite.quantity} - ${disponibilite.reservedQuantity} >= ${delta}`
          )
        )
        .returning({ id: disponibilite.id })

      if (!stockUpdated) {
        return NextResponse.json(
          { error: "Stock insuffisant pour augmenter la quantité réservée" },
          { status: 409 }
        )
      }
    } else {
      const decrease = Math.abs(delta)
      if (existing.disponibiliteId) {
        await db
          .update(disponibilite)
          .set({
            reservedQuantity: sql`GREATEST(0, ${disponibilite.reservedQuantity} - ${decrease})`,
            updatedAt: new Date(),
          })
          .where(eq(disponibilite.id, existing.disponibiliteId))
      }
    }

    const [updated] = await db
      .update(reservation)
      .set({
        quantity: nextQuantity,
        amount,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(reservation.id, existing.id),
          eq(reservation.userId, currentUser.id),
          eq(reservation.status, "confirmed")
        )
      )
      .returning({
        id: reservation.id,
        quantity: reservation.quantity,
        amount: reservation.amount,
        status: reservation.status,
        reservationCode: reservation.reservationCode,
      })

    if (!updated) {
      // Compensate stock if reservation update did not apply.
      if (delta > 0 && existing.disponibiliteId) {
        await db
          .update(disponibilite)
          .set({
            reservedQuantity: sql`GREATEST(0, ${disponibilite.reservedQuantity} - ${delta})`,
            updatedAt: new Date(),
          })
          .where(eq(disponibilite.id, existing.disponibiliteId))
          .catch(() => undefined)
      }
      return NextResponse.json(
        { error: "La réservation n'a plus pu être modifiée" },
        { status: 409 }
      )
    }

    await createNotification({
      userId: currentUser.id,
      type: "reservation",
      title: "Réservation modifiée",
      message: `Votre réservation ${existing.reservationCode} a été modifiée: ${nextQuantity} bouteille(s), ${amount.toLocaleString("fr-FR")} FCFA à régler au dépôt.`,
      link: buildNotificationLink("reservation", existing.id, "client-reservations"),
    })

    // Notify vendor owning the point.
    const [vendorPoint] = await db
      .select({ vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, existing.pointId))
      .limit(1)

    if (vendorPoint?.vendorId) {
      await createNotification({
        userId: vendorPoint.vendorId,
        type: "reservation",
        title: "Réservation modifiée par le client",
        message: `La réservation ${existing.reservationCode} a été modifiée: ${nextQuantity} bouteille(s), ${amount.toLocaleString("fr-FR")} FCFA.`,
        link: buildNotificationLink("reservation", existing.id, "vendor-reservations"),
      })
    }

    return NextResponse.json({ ok: true, reservation: updated })
  } catch (error) {
    console.error("Erreur modification réservation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, context: ReservationRouteContext) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }

    const { id } = await context.params
    if (!id) {
      return NextResponse.json({ error: "ID de réservation requis" }, { status: 400 })
    }

    const existing = await getOwnedReservation(id, currentUser.id)
    if (!existing) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    // Only cancelled reservations can be removed from the client's view.
    // Active, collected or other history must not be unjustifiably erased.
    if (existing.status !== "cancelled") {
      return NextResponse.json(
        {
          error:
            "Seule une réservation annulée peut être supprimée. Les réservations actives ou collectées sont conservées.",
        },
        { status: 409 }
      )
    }

    const [deleted] = await db
      .delete(reservation)
      .where(
        and(
          eq(reservation.id, existing.id),
          eq(reservation.userId, currentUser.id),
          eq(reservation.status, "cancelled")
        )
      )
      .returning({ id: reservation.id })

    if (!deleted) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    return NextResponse.json({ ok: true, id: deleted.id })
  } catch (error) {
    console.error("Erreur suppression réservation:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
