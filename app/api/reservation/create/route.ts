import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, disponibilite, pointDeVente, user } from "@/db/schema"
import { eq, and, lt, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { requireUser } from "@/lib/session"
import {
  AD_ATTRIBUTION_COOKIE,
  recordConversionFromRequest,
} from "@/lib/publicite-attribution"

const DEFAULT_RESERVATION_AMOUNT = 1000 // FCFA
const RESERVATION_EXPIRY_MINUTES = 30

function generateReservationCode(pointName: string): string {
  const now = new Date()
  const datePart = now.toISOString().slice(2, 10).replace(/-/g, "") // AAMMJJ
  const namePart = pointName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 6)
    .padEnd(6, "X")
  return `${datePart}${namePart}`
}

async function ensureUniqueCode(baseCode: string): Promise<string> {
  let code = baseCode
  let attempt = 0
  while (true) {
    const existing = await db
      .select({ id: reservation.id })
      .from(reservation)
      .where(eq(reservation.reservationCode, code))
      .limit(1)
    if (existing.length === 0) return code
    attempt++
    const suffix = attempt.toString().padStart(2, "0")
    code = baseCode.slice(0, 10) + suffix
  }
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await requireUser()
    const body = (await req.json().catch(() => null)) as {
      disponibiliteId?: string
      pointId?: string
      brand?: string
      format?: string
      quantity?: number
      amountType?: "reservation" | "consigne" | "mixed"
    } | null

    if (!body) {
      return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
    }

    const {
      disponibiliteId,
      pointId,
      brand,
      format,
      quantity = 1,
      amountType = "reservation",
    } = body

    if (!brand || !format) {
      return NextResponse.json(
        { error: "Marque et format sont requis" },
        { status: 400 }
      )
    }

    let targetDisponibiliteId = disponibiliteId
    let targetPointId = pointId

    // If disponibiliteId provided, verify it exists and get point info
    if (disponibiliteId) {
      const [dispo] = await db
        .select({
          id: disponibilite.id,
          pointId: disponibilite.pointId,
          quantity: disponibilite.quantity,
          reservedQuantity: disponibilite.reservedQuantity,
          brand: disponibilite.brand,
          format: disponibilite.format,
          status: disponibilite.status,
          expiresAt: disponibilite.expiresAt,
        })
        .from(disponibilite)
        .where(eq(disponibilite.id, disponibiliteId))
        .limit(1)

      if (!dispo) {
        return NextResponse.json(
          { error: "Disponibilité introuvable" },
          { status: 404 }
        )
      }

      targetPointId = dispo.pointId
      targetDisponibiliteId = dispo.id

      // Check if expired
      if (dispo.expiresAt && new Date(dispo.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "Cette disponibilité a expiré" },
          { status: 400 }
        )
      }

      // Check status
      if (dispo.status !== "disponible") {
        return NextResponse.json(
          { error: "Cette disponibilité n'est plus disponible" },
          { status: 400 }
        )
      }

      // Check available quantity (quantity - reservedQuantity)
      const available = (dispo.quantity ?? 0) - (dispo.reservedQuantity ?? 0)
      if (available < quantity) {
        return NextResponse.json(
          { error: "Stock insuffisant pour cette réservation" },
          { status: 400 }
        )
      }
    } else if (pointId) {
      // If only pointId provided, find the latest disponibilite for this point
      const [dispo] = await db
        .select({
          id: disponibilite.id,
          pointId: disponibilite.pointId,
          quantity: disponibilite.quantity,
          reservedQuantity: disponibilite.reservedQuantity,
          brand: disponibilite.brand,
          format: disponibilite.format,
          status: disponibilite.status,
          expiresAt: disponibilite.expiresAt,
        })
        .from(disponibilite)
        .where(
          and(
            eq(disponibilite.pointId, pointId),
            eq(disponibilite.brand, brand),
            eq(disponibilite.format, format),
            eq(disponibilite.status, "disponible")
          )
        )
        .orderBy(sql`${disponibilite.createdAt} DESC`)
        .limit(1)

      if (!dispo) {
        return NextResponse.json(
          { error: "Aucune disponibilité correspondante pour ce dépôt" },
          { status: 404 }
        )
      }

      // Check if expired
      if (dispo.expiresAt && new Date(dispo.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "Cette disponibilité a expiré" },
          { status: 400 }
        )
      }

      // Check available quantity
      const available = (dispo.quantity ?? 0) - (dispo.reservedQuantity ?? 0)
      if (available < quantity) {
        return NextResponse.json(
          { error: "Stock insuffisant pour cette réservation" },
          { status: 400 }
        )
      }

      targetDisponibiliteId = dispo.id
    } else {
      return NextResponse.json(
        { error: "Disponibilité ou dépôt requis" },
        { status: 400 }
      )
    }

    // Get point details for code generation
    const [point] = await db
      .select({ name: pointDeVente.name, vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, targetPointId!))
      .limit(1)

    if (!point) {
      return NextResponse.json(
        { error: "Point de vente introuvable" },
        { status: 404 }
      )
    }

    // Get vendor user info
    const [vendor] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.id, point.vendorId!))
      .limit(1)

    // Generate unique reservation code
    const baseCode = generateReservationCode(point.name)
    const reservationCode = await ensureUniqueCode(baseCode)

    // Calculate expiry time
    const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MINUTES * 60 * 1000)

    // Use a transaction to ensure atomicity
    const result = await db.transaction(async (tx) => {
      // Lock the disponibilite row and check again
      const [lockedDispo] = await tx
        .select({
          id: disponibilite.id,
          quantity: disponibilite.quantity,
          reservedQuantity: disponibilite.reservedQuantity,
        })
        .from(disponibilite)
        .where(eq(disponibilite.id, targetDisponibiliteId!))
        .limit(1)

      if (!lockedDispo) {
        throw new Error("Disponibilité introuvable lors de la transaction")
      }

      const available = (lockedDispo.quantity ?? 0) - (lockedDispo.reservedQuantity ?? 0)
      if (available < quantity) {
        throw new Error("Stock insuffisant (concurrence)")
      }

      // Increment reserved quantity
      await tx
        .update(disponibilite)
        .set({
          reservedQuantity: (lockedDispo.reservedQuantity ?? 0) + quantity,
          updatedAt: new Date(),
        })
        .where(eq(disponibilite.id, targetDisponibiliteId!))

      // Create reservation
      const reservationId = randomUUID()
      await tx.insert(reservation).values({
        id: reservationId,
        userId: currentUser.id,
        clientName: currentUser.name,
        clientPhone: currentUser.phoneNumber ?? null,
        vendorId: point.vendorId!,
        pointId: targetPointId!,
        disponibiliteId: targetDisponibiliteId,
        brand,
        format,
        quantity,
        reservationCode,
        amount: DEFAULT_RESERVATION_AMOUNT,
        amountType,
        status: "confirmed",
        expiresAt,
        reservedAt: new Date(),
      })

      return { reservationId, reservationCode, expiresAt }
    })

    // Attribution publicitaire : réservation faite dans les 30 jours après un clic.
    if (req.cookies.get(AD_ATTRIBUTION_COOKIE)) {
      await recordConversionFromRequest(req, "reservation", { userId: currentUser.id })
    }

    return NextResponse.json({
      ok: true,
      reservation: {
        id: result.reservationId,
        code: result.reservationCode,
        expiresAt: result.expiresAt.toISOString(),
        amount: DEFAULT_RESERVATION_AMOUNT,
        amountType,
        brand,
        format,
        quantity,
      },
    })
  } catch (err) {
    console.error("[reservation/create] error:", err)
    const message =
      err instanceof Error ? err.message : "Erreur lors de la réservation"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}