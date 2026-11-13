import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, pointDeVente } from "@/db/schema"
import { eq } from "drizzle-orm"
import { getProUser } from "@/lib/session"
import { formatDateTime } from "@/lib/gaz"

const RESERVATION_CODE_LENGTH = 10

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

    if (!code || code.length !== RESERVATION_CODE_LENGTH) {
      return NextResponse.json(
        { error: `Code de réservation invalide (${RESERVATION_CODE_LENGTH} caractères requis)` },
        { status: 400 }
      )
    }

    const [res] = await db
      .select({
        id: reservation.id,
        userId: reservation.userId,
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

    // Verify the reservation belongs to this vendor's point
    const [point] = await db
      .select({ vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, res.pointId))
      .limit(1)

    if (!point || point.vendorId !== user.id) {
      return NextResponse.json(
        { error: "Cette réservation ne concerne pas votre dépôt" },
        { status: 403 }
      )
    }

    // Check if expired
    const isExpired = res.expiresAt && new Date(res.expiresAt) < new Date()
    const effectiveStatus = isExpired && res.status === "confirmed" ? "expired" : res.status

    // If already collected, return error
    if (effectiveStatus === "collected") {
      return NextResponse.json(
        { error: "Cette réservation a déjà été retirée", status: "collected" },
        { status: 400 }
      )
    }

    // If cancelled or expired, return error
    if (effectiveStatus === "cancelled") {
      return NextResponse.json(
        { error: "Cette réservation a été annulée", status: "cancelled" },
        { status: 400 }
      )
    }

    if (effectiveStatus === "expired") {
      return NextResponse.json(
        { error: "Cette réservation a expiré", status: "expired" },
        { status: 400 }
      )
    }

    // Valid reservation - return details for confirmation
    return NextResponse.json({
      ok: true,
      reservation: {
        ...res,
        status: effectiveStatus,
        isExpired,
        reservedAtFormatted: formatDateTime(res.reservedAt),
        pointName: res.pointId, // Will be resolved by frontend
      },
      canCollect: effectiveStatus === "confirmed",
    })
  } catch (err) {
    console.error("[reservation/scan] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    )
  }
}