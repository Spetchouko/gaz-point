import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, disponibilite } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { getProUser } from "@/lib/session"

/**
 * Libère le stock réservé par une réservation qui ne sera jamais retirée.
 * Utilisé pour les réservations expirées : sans cela, le stock réservé
 * resterait bloqué indéfiniment (aucun cron ne nettoie ces lignes).
 */
async function releaseReservedStock(disponibiliteId: string | null, quantity: number) {
  if (!disponibiliteId) return
  await db
    .update(disponibilite)
    .set({
      reservedQuantity: sql`GREATEST(0, ${disponibilite.reservedQuantity} - ${quantity})`,
      updatedAt: new Date(),
    })
    .where(eq(disponibilite.id, disponibiliteId))
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
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

    if (res.vendorId !== user.id) {
      return NextResponse.json(
        { error: "Cette réservation ne concerne pas votre dépôt" },
        { status: 403 }
      )
    }

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
    if (isExpired) {
      // La réservation ne peut plus être honorée : on la solde et on rend le
      // stock réservé plutôt que de le laisser bloqué.
      const [expired] = await db
        .update(reservation)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(and(eq(reservation.id, res.id), eq(reservation.status, "confirmed")))
        .returning({ id: reservation.id })

      if (expired) {
        await releaseReservedStock(res.disponibiliteId, res.quantity)
      }

      return NextResponse.json(
        { error: "Cette réservation a expiré" },
        { status: 400 }
      )
    }

    // Le driver neon-http ne supporte pas db.transaction(). On « réclame » la
    // réservation par un UPDATE conditionnel sur le statut : deux scans
    // simultanés du même code ne peuvent pas aboutir tous les deux.
    const [claimed] = await db
      .update(reservation)
      .set({
        status: "collected",
        collectedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(and(eq(reservation.id, res.id), eq(reservation.status, "confirmed")))
      .returning({ id: reservation.id })

    if (!claimed) {
      return NextResponse.json(
        { error: "Cette réservation n'est plus disponible" },
        { status: 409 }
      )
    }

    // Décrémente le stock physique et le stock réservé en une seule requête.
    if (res.disponibiliteId) {
      await db
        .update(disponibilite)
        .set({
          quantity: sql`GREATEST(0, COALESCE(${disponibilite.quantity}, 0) - ${res.quantity})`,
          reservedQuantity: sql`GREATEST(0, ${disponibilite.reservedQuantity} - ${res.quantity})`,
          updatedAt: new Date(),
        })
        .where(eq(disponibilite.id, res.disponibiliteId))
    }

    return NextResponse.json({ ok: true, message: "Retrait confirmé" })
  } catch (err) {
    console.error("[reservation/collect] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la confirmation du retrait" },
      { status: 500 }
    )
  }
}
