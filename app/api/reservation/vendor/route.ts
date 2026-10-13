import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, pointDeVente, user } from "@/db/schema"
import { eq, desc, and, inArray } from "drizzle-orm"
import { requirePro } from "@/lib/session"
import { formatDateTime } from "@/lib/gaz"

export async function GET(req: NextRequest) {
  try {
    const { user, role } = await requirePro()
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const pointId = searchParams.get("pointId")

    // Get vendor's points
    const points = await db
      .select({ id: pointDeVente.id })
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, user.id))

    const pointIds = points.map((p) => p.id)
    if (pointIds.length === 0) {
      return NextResponse.json({ reservations: [] })
    }

    const conditions = [inArray(reservation.pointId, pointIds)]
    if (status) {
      conditions.push(eq(reservation.status, status))
    }
    if (pointId) {
      conditions.push(eq(reservation.pointId, pointId))
    }

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
      .orderBy(desc(reservation.reservedAt))

    // Add computed status
    const now = new Date()
    const reservationsWithStatus = reservations.map((r) => {
      const isExpired = r.expiresAt && new Date(r.expiresAt) < now
      const effectiveStatus = isExpired && r.status === "confirmed" ? "expired" : r.status
      return {
        ...r,
        status: effectiveStatus,
        isExpired,
        reservedAtFormatted: formatDateTime(r.reservedAt),
        collectedAtFormatted: r.collectedAt ? formatDateTime(r.collectedAt) : null,
        cancelledAtFormatted: r.cancelledAt ? formatDateTime(r.cancelledAt) : null,
      }
    })

    return NextResponse.json({ reservations: reservationsWithStatus })
  } catch (err) {
    console.error("[reservation/vendor] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    )
  }
}