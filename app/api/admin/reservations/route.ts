import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, user, pointDeVente } from "@/db/schema"
import { eq, count, desc, ilike, or, and } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""

    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(reservation.reservationCode, `%${search}%`),
          ilike(reservation.clientName, `%${search}%`),
          ilike(pointDeVente.name, `%${search}%`)
        )
      )
    }
    if (status) {
      conditions.push(eq(reservation.status, status))
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(reservation)
      .leftJoin(user, eq(reservation.userId, user.id))
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .catch(() => [{ count: 0 }])

    const total = totalResult.count ?? 0

    const reservations = await db
      .select({
        id: reservation.id,
        reservationCode: reservation.reservationCode,
        status: reservation.status,
        brand: reservation.brand,
        format: reservation.format,
        quantity: reservation.quantity,
        amount: reservation.amount,
        amountType: reservation.amountType,
        reservedAt: reservation.reservedAt,
        collectedAt: reservation.collectedAt,
        cancelledAt: reservation.cancelledAt,
        expiresAt: reservation.expiresAt,
        clientName: reservation.clientName,
        clientPhone: reservation.clientPhone,
        clientUserName: user.name,
        clientUserEmail: user.email,
        vendorId: reservation.vendorId,
        pointId: reservation.pointId,
        pointName: pointDeVente.name,
        pointDistrict: pointDeVente.district,
      })
      .from(reservation)
      .leftJoin(user, eq(reservation.userId, user.id))
      .leftJoin(pointDeVente, eq(reservation.pointId, pointDeVente.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(reservation.reservedAt))
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)

    return NextResponse.json({
      reservations,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error("[admin/reservations] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des réservations" },
      { status: 500 }
    )
  }
}
