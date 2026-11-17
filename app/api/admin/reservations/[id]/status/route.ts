import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, adminAction, user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"
import { createNotification, buildNotificationLink } from "@/lib/notifications"

const VALID_STATUSES = ["confirmed", "collected", "cancelled"] as const

/**
 * PATCH /api/admin/reservations/[id]/status
 * Modifie le statut d'une réservation (confirmer, marquer récupérée, annuler).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("reservations")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const admin = staff.user

    const { id } = await params
    const body = (await req.json().catch(() => null)) as { status?: string } | null

    if (!body?.status || !VALID_STATUSES.includes(body.status as any)) {
      return NextResponse.json(
        { error: "Statut invalide (confirmée, récupérée, annulée)" },
        { status: 400 }
      )
    }

    const [existing] = await db
      .select({
        id: reservation.id,
        status: reservation.status,
        reservationCode: reservation.reservationCode,
        clientName: reservation.clientName,
      })
      .from(reservation)
      .where(eq(reservation.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
    }

    const now = new Date()
    const updates: Record<string, unknown> = { status: body.status, updatedAt: now }

    if (body.status === "collected" && existing.status !== "collected") {
      updates.collectedAt = now
    }
    if (body.status === "cancelled" && existing.status !== "cancelled") {
      updates.cancelledAt = now
    }

    await db.update(reservation).set(updates).where(eq(reservation.id, id))

    // Créer notification pour le client selon le nouveau statut
    try {
      const [res] = await db
        .select({ userId: reservation.userId, vendorId: reservation.vendorId, reservationCode: reservation.reservationCode })
        .from(reservation)
        .where(eq(reservation.id, id))
        .limit(1)

      if (res?.userId) {
        let title = ""
        let message = ""

        switch (body.status) {
          case "confirmed":
            title = "Réservation confirmée"
            message = `Votre réservation ${res.reservationCode} a été confirmée par l'administration.`
            break
          case "collected":
            title = "Réservation récupérée"
            message = `Votre réservation ${res.reservationCode} a été marquée comme récupérée.`
            break
          case "cancelled":
            title = "Réservation annulée"
            message = `Votre réservation ${res.reservationCode} a été annulée par l'administration.`
            break
        }

        if (title) {
          await createNotification({
            userId: res.userId,
            type: "reservation",
            title,
            message,
            link: buildNotificationLink("reservation", id, "client-reservations"),
          })
        }

        if (res?.vendorId) {
          await createNotification({
            userId: res.vendorId,
            type: "reservation",
            title: `Réservation ${body.status}`,
            message: `La réservation ${res.reservationCode} a été marquée comme ${body.status} par l'administration.`,
            link: buildNotificationLink("reservation", id, "vendor-reservations"),
          })
        }
      }
    } catch {
      // Ignorer les erreurs de notification
    }

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "reservation",
        targetId: id,
        action: "update",
        details: JSON.stringify({
          reservationCode: existing.reservationCode,
          clientName: existing.clientName,
          status: body.status,
        }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Réservation mise à jour avec succès",
      reservation: { id, status: body.status },
    })
  } catch (err) {
    console.error("[admin/reservations/[id]/status PATCH] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la modification de la réservation" },
      { status: 500 }
    )
  }
}
