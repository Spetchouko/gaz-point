import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, pointDeVente } from "@/db/schema"
import { eq, desc, and, inArray, sql, count } from "drizzle-orm"
import { getProUser } from "@/lib/session"
import { formatDateTime } from "@/lib/gaz"
import { generateReservationQRCode } from "@/lib/qrcode"

export async function GET(req: NextRequest) {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const pointId = searchParams.get("pointId")
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10) || 50

    // Get vendor's points
    const points = await db
      .select({ id: pointDeVente.id })
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, user.id))

    const pointIds = points.map((p) => p.id)
    if (pointIds.length === 0) {
      return NextResponse.json({
        reservations: [],
        pagination: { total: 0, page, pageSize, totalPages: 0 },
      })
    }

    const conditions = [inArray(reservation.pointId, pointIds)]
    if (status) {
      conditions.push(eq(reservation.status, status))
    }
    if (pointId) {
      conditions.push(eq(reservation.pointId, pointId))
    }

    const totalResult = await db
      .select({ count: count() })
      .from(reservation)
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(and(...conditions))
      .catch(() => [{ count: 0 }])

    const total = totalResult[0]?.count ?? 0

    const reservations = await db
      .select({
        id: reservation.id,
        clientName: reservation.clientName,
        clientPhone: reservation.clientPhone,
        vendorId: reservation.vendorId,
        pointId: reservation.pointId,
        brand: reservation.brand,
        format: reservation.format,
        quantity: reservation.quantity,
        reservationCode: reservation.reservationCode,
        amount: reservation.amount,
        amountType: reservation.amountType,
        status: reservation.status,
        reservedAt: reservation.reservedAt,
        collectedAt: reservation.collectedAt,
        cancelledAt: reservation.cancelledAt,
        expiresAt: reservation.expiresAt,
        pointName: pointDeVente.name,
        pointDistrict: pointDeVente.district,
        pointAddress: pointDeVente.address,
      })
      .from(reservation)
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(and(...conditions))
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)
      .orderBy(desc(reservation.reservedAt))

    // Add computed status and QR Code
    const now = new Date()
    const reservationsWithStatus = await Promise.all(
      reservations.map(async (r) => {
        const isExpired = r.expiresAt && new Date(r.expiresAt) < now
        // Map statuses to the new system
        let effectiveStatus = r.status
        let statusLabel = r.status
        const isReservedAtOld = r.reservedAt && new Date(r.reservedAt) < new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 30 days old

        switch (r.status) {
          case "confirmed":
            effectiveStatus = "confirmed"
            statusLabel = "Confirmée"
            break
          case "collected":
            effectiveStatus = "collected"
            statusLabel = "Retirée"
            break
          case "cancelled":
            effectiveStatus = "cancelled"
            statusLabel = "Annulée"
            break
          case "en_attente":
          case "pending":
            effectiveStatus = "en_attente"
            statusLabel = "En attente"
            break
          case "terminee":
          case "completed":
            effectiveStatus = "terminee"
            statusLabel = "Terminée"
            break
          default:
            effectiveStatus = r.status
            statusLabel = r.status
        }

        // Generate QR Code for confirmed reservations
        const qrCode = effectiveStatus === "confirmed"
          ? await generateReservationQRCode(r.reservationCode)
          : undefined

        return {
          ...r,
          status: effectiveStatus,
          statusLabel,
          isExpired,
          qrCode,
          reservedAtFormatted: formatDateTime(r.reservedAt),
          collectedAtFormatted: r.collectedAt ? formatDateTime(r.collectedAt) : null,
          cancelledAtFormatted: r.cancelledAt ? formatDateTime(r.cancelledAt) : null,
        }
      })
    )

    return NextResponse.json({
      reservations: reservationsWithStatus,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error("[reservation/vendor] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    )
  }
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

    const body = await req.json()
    const { action, reservationId, newStatus } = body

    switch (action) {
      case "confirm": {
        await db
          .update(reservation)
          .set({ status: "confirmed", collectedAt: null })
          .where(eq(reservation.id, reservationId))
        return NextResponse.json({ ok: true, message: "Réservation confirmée" })
      }
      case "cancel": {
        await db
          .update(reservation)
          .set({ status: "cancelled", cancelledAt: new Date() })
          .where(eq(reservation.id, reservationId))
        return NextResponse.json({ ok: true, message: "Réservation annulée" })
      }
      case "terminee": {
        await db
          .update(reservation)
          .set({ status: "terminee", collectedAt: new Date() })
          .where(eq(reservation.id, reservationId))
        return NextResponse.json({ ok: true, message: "Réservation marquée comme terminée" })
      }
      case "en_attente": {
        await db
          .update(reservation)
          .set({ status: "en_attente" })
          .where(eq(reservation.id, reservationId))
        return NextResponse.json({ ok: true, message: "Réservation en attente" })
      }
      default:
        return NextResponse.json({ error: "Action inconnue" }, { status: 400 })
    }
  } catch (err) {
    console.error("[reservation/vendor/action] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la mise à jour de la réservation" },
      { status: 500 }
    )
  }
}