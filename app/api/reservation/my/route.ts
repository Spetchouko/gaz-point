import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, pointDeVente } from "@/db/schema"
import { eq, desc, and, count } from "drizzle-orm"
import { getCurrentUser } from "@/lib/session"
import { formatDateTime } from "@/lib/gaz"
import { generateReservationQRCode } from "@/lib/qrcode"

export async function GET(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "50", 10) || 50

    const conditions = [eq(reservation.userId, currentUser.id)]
    if (status) {
      conditions.push(eq(reservation.status, status))
    }

    const totalResult = await db
      .select({ count: count() })
      .from(reservation)
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
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
        pointPhone: pointDeVente.phone,
      })
      .from(reservation)
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)
      .orderBy(desc(reservation.reservedAt))

    // Add computed status (check expiry) and QR Code
    const now = new Date()
    const reservationsWithStatus = await Promise.all(
      reservations.map(async (r) => {
        const isExpired = r.expiresAt && new Date(r.expiresAt) < now
        const effectiveStatus = isExpired && r.status === "confirmed" ? "expired" : r.status
        // Generate QR Code for confirmed reservations
        const qrCode = effectiveStatus === "confirmed"
          ? await generateReservationQRCode(r.reservationCode)
          : undefined

        return {
          ...r,
          status: effectiveStatus,
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
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    })
  } catch (err) {
    console.error("[reservation/my] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    )
  }
}