import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, pointDeVente } from "@/db/schema"
import { eq, and } from "drizzle-orm"
import { requirePro } from "@/lib/session"

export async function POST(req: NextRequest) {
  try {
    const { user, role } = await requirePro()
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as { code?: string } | null
    const code = body?.code?.trim().toUpperCase()

    if (!code || code.length !== 12) {
      return NextResponse.json(
        { error: "Code de réservation invalide (12 caractères requis)" },
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

    return NextResponse.json({
      ok: true,
      reservation: {
        ...res,
        status: effectiveStatus,
        isExpired,
      },
    })
  } catch (err) {
    console.error("[reservation/verify] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    )
  }
}