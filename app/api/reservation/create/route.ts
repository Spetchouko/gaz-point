import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, disponibilite, pointDeVente } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { getCurrentUser } from "@/lib/session"
import {
  AD_ATTRIBUTION_COOKIE,
  recordConversionFromRequest,
} from "@/lib/publicite-attribution"

const DEFAULT_RESERVATION_AMOUNT = 1000 // FCFA
const RESERVATION_EXPIRY_MINUTES = 30
const MAX_RESERVATION_QUANTITY = 20

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
    if (attempt > 99) {
      throw new Error("Impossible de générer un code de réservation unique")
    }
    const suffix = attempt.toString().padStart(2, "0")
    code = baseCode.slice(0, 10) + suffix
  }
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

export async function POST(req: NextRequest) {
  try {
    const currentUser = await getCurrentUser()
    if (!currentUser) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
    }
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

    const disponibiliteId = cleanText(body.disponibiliteId, 100)
    const pointId = cleanText(body.pointId, 100)
    const brand = cleanText(body.brand, 80)
    const format = cleanText(body.format, 80)
    const rawQuantity = body.quantity ?? 1
    const amountType =
      body.amountType === "consigne" || body.amountType === "mixed"
        ? body.amountType
        : "reservation"

    if (!brand || !format) {
      return NextResponse.json(
        { error: "Marque et format sont requis" },
        { status: 400 }
      )
    }

    // La quantité doit être un entier strictement positif et borné : sans ce
    // contrôle une quantité négative réduirait le stock réservé.
    if (
      typeof rawQuantity !== "number" ||
      !Number.isInteger(rawQuantity) ||
      rawQuantity < 1 ||
      rawQuantity > MAX_RESERVATION_QUANTITY
    ) {
      return NextResponse.json(
        { error: `Quantité invalide (entre 1 et ${MAX_RESERVATION_QUANTITY})` },
        { status: 400 }
      )
    }
    const quantity = rawQuantity

    const dispoColumns = {
      id: disponibilite.id,
      pointId: disponibilite.pointId,
      quantity: disponibilite.quantity,
      reservedQuantity: disponibilite.reservedQuantity,
      brand: disponibilite.brand,
      format: disponibilite.format,
      status: disponibilite.status,
      expiresAt: disponibilite.expiresAt,
    }

    let targetDisponibiliteId: string
    let targetPointId: string

    if (disponibiliteId) {
      const [dispo] = await db
        .select(dispoColumns)
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

      if (dispo.expiresAt && new Date(dispo.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "Cette disponibilité a expiré" },
          { status: 400 }
        )
      }

      if (dispo.status !== "disponible") {
        return NextResponse.json(
          { error: "Cette disponibilité n'est plus disponible" },
          { status: 400 }
        )
      }

      const available = (dispo.quantity ?? 0) - (dispo.reservedQuantity ?? 0)
      if (available < quantity) {
        return NextResponse.json(
          { error: "Stock insuffisant pour cette réservation" },
          { status: 400 }
        )
      }
    } else if (pointId) {
      const [dispo] = await db
        .select(dispoColumns)
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

      if (dispo.expiresAt && new Date(dispo.expiresAt) < new Date()) {
        return NextResponse.json(
          { error: "Cette disponibilité a expiré" },
          { status: 400 }
        )
      }

      const available = (dispo.quantity ?? 0) - (dispo.reservedQuantity ?? 0)
      if (available < quantity) {
        return NextResponse.json(
          { error: "Stock insuffisant pour cette réservation" },
          { status: 400 }
        )
      }

      targetPointId = dispo.pointId
      targetDisponibiliteId = dispo.id
    } else {
      return NextResponse.json(
        { error: "Disponibilité ou dépôt requis" },
        { status: 400 }
      )
    }

    const [point] = await db
      .select({ name: pointDeVente.name, vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, targetPointId))
      .limit(1)

    if (!point || !point.vendorId) {
      return NextResponse.json(
        { error: "Point de vente introuvable" },
        { status: 404 }
      )
    }

    const baseCode = generateReservationCode(point.name)
    const reservationCode = await ensureUniqueCode(baseCode)
    const expiresAt = new Date(Date.now() + RESERVATION_EXPIRY_MINUTES * 60 * 1000)
    const reservationId = randomUUID()

    // Le driver neon-http ne supporte pas db.transaction(). L'atomicité est
    // obtenue par un UPDATE conditionnel : l'incrément du stock réservé ne
    // s'applique que si le stock restant est suffisant. Deux requêtes
    // concurrentes ne peuvent donc pas réserver la même bouteille.
    const reserved = await db
      .update(disponibilite)
      .set({
        reservedQuantity: sql`${disponibilite.reservedQuantity} + ${quantity}`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(disponibilite.id, targetDisponibiliteId),
          sql`COALESCE(${disponibilite.quantity}, 0) - ${disponibilite.reservedQuantity} >= ${quantity}`
        )
      )
      .returning({ id: disponibilite.id })

    if (reserved.length === 0) {
      return NextResponse.json(
        { error: "Stock insuffisant pour cette réservation" },
        { status: 409 }
      )
    }

    try {
      await db.insert(reservation).values({
        id: reservationId,
        userId: currentUser.id,
        clientName: currentUser.name,
        clientPhone: currentUser.phoneNumber ?? null,
        vendorId: point.vendorId,
        pointId: targetPointId,
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
    } catch (insertError) {
      // Compensation : on relâche le stock réservé si la réservation n'a pas
      // pu être créée, afin de ne pas bloquer une bouteille inutilement.
      await db
        .update(disponibilite)
        .set({
          reservedQuantity: sql`GREATEST(0, ${disponibilite.reservedQuantity} - ${quantity})`,
          updatedAt: new Date(),
        })
        .where(eq(disponibilite.id, targetDisponibiliteId))
        .catch(() => undefined)
      throw insertError
    }

    // Attribution publicitaire : réservation faite dans les 30 jours après un clic.
    if (req.cookies.get(AD_ATTRIBUTION_COOKIE)) {
      await recordConversionFromRequest(req, "reservation", { userId: currentUser.id })
    }

    return NextResponse.json({
      ok: true,
      reservation: {
        id: reservationId,
        code: reservationCode,
        expiresAt: expiresAt.toISOString(),
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
