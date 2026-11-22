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
import {
  RESERVATION_CODE_LENGTH,
  randomReservationCodeSuffix,
} from "@/lib/reservation-code"
import {
  buildNotificationLink,
  createNotification,
} from "@/lib/notifications"
import { calculateReservationAmount } from "@/lib/reservation-amount"

const RESERVATION_EXPIRY_MINUTES = 1440 // 24 heures
const MAX_RESERVATION_QUANTITY = 20

/**
 * Génère le préfixe lisible GP + DDMMYY + 2 premières lettres du dépôt.
 * Le suffixe aléatoire est ajouté ensuite pour atteindre 12 caractères.
 */
function buildBaseReservationCode(depotName: string): string {
  const now = new Date()
  const day = String(now.getDate()).padStart(2, "0")
  const month = String(now.getMonth() + 1).padStart(2, "0")
  const year = String(now.getFullYear()).slice(-2)
  const datePart = `${day}${month}${year}` // DDMMYY (6 caractères)

  const depotLetters = depotName
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 2)
    .padEnd(2, "X") // 2 lettres, padding avec X si besoin

  return `GP${datePart}${depotLetters}` // Préfixe de 10 caractères
}

async function ensureUniqueCode(baseCode: string): Promise<string> {
  const suffixLength = RESERVATION_CODE_LENGTH - baseCode.length
  let attempts = 0
  while (attempts < 20) {
    const code = `${baseCode}${randomReservationCodeSuffix(suffixLength)}`
    const existing = await db
      .select({ id: reservation.id })
      .from(reservation)
      .where(eq(reservation.reservationCode, code))
      .limit(1)
    if (!existing || existing.length === 0) return code
    attempts++
  }
  throw new Error("Impossible de générer un code de réservation unique")
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
    const requestedBrand = cleanText(body.brand, 80)
    const requestedFormat = cleanText(body.format, 80)
    const rawQuantity = body.quantity ?? 1
    const amountType =
      body.amountType === "consigne" || body.amountType === "mixed"
        ? body.amountType
        : "reservation"
    let brand: string | null = null
    let format: string | null = null

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
    const amount = calculateReservationAmount(quantity)
    if (amount === null) {
      return NextResponse.json(
        { error: "Impossible de calculer le montant à régler au dépôt" },
        { status: 400 }
      )
    }

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

      // La marque et le format proviennent toujours de la disponibilité
      // sélectionnée. Les valeurs envoyées par le navigateur ne sont pas
      // utilisées pour décrire le stock réservé.
      brand = dispo.brand
      format = dispo.format
      if (!brand || !format) {
        return NextResponse.json(
          { error: "Cette disponibilité ne précise pas la marque et le format" },
          { status: 400 }
        )
      }

      // Vérifie le stock uniquement si le vendeur a renseigné une quantité.
      if (dispo.quantity !== null && dispo.quantity !== undefined) {
        const available = (dispo.quantity ?? 0) - (dispo.reservedQuantity ?? 0)
        if (available < quantity) {
          return NextResponse.json(
            { error: "Stock insuffisant pour cette réservation" },
            { status: 400 }
          )
        }
      }
    } else if (pointId) {
      const pointConditions = [
        eq(disponibilite.pointId, pointId),
        eq(disponibilite.status, "disponible"),
      ]
      if (requestedBrand) {
        pointConditions.push(eq(disponibilite.brand, requestedBrand))
      }
      if (requestedFormat) {
        pointConditions.push(eq(disponibilite.format, requestedFormat))
      }

      const [dispo] = await db
        .select(dispoColumns)
        .from(disponibilite)
        .where(and(...pointConditions))
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

      brand = dispo.brand
      format = dispo.format
      if (!brand || !format) {
        return NextResponse.json(
          { error: "Cette disponibilité ne précise pas la marque et le format" },
          { status: 400 }
        )
      }

      // Vérifie le stock uniquement si renseigné.
      if (dispo.quantity !== null && dispo.quantity !== undefined) {
        const available = (dispo.quantity ?? 0) - (dispo.reservedQuantity ?? 0)
        if (available < quantity) {
          return NextResponse.json(
            { error: "Stock insuffisant pour cette réservation" },
            { status: 400 }
          )
        }
      }

      targetPointId = dispo.pointId
      targetDisponibiliteId = dispo.id
    } else {
      return NextResponse.json(
        { error: "Disponibilité ou dépôt requis" },
        { status: 400 }
      )
    }

    if (!brand || !format) {
      return NextResponse.json(
        { error: "La disponibilité sélectionnée est incomplète" },
        { status: 400 }
      )
    }

    const [point] = await db
      .select({
        name: pointDeVente.name,
        district: pointDeVente.district,
        vendorId: pointDeVente.vendorId,
      })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, targetPointId))
      .limit(1)

    if (!point || !point.vendorId) {
      return NextResponse.json(
        { error: "Point de vente introuvable" },
        { status: 404 }
      )
    }

    // Génération du code de réservation au format GP + DDMMYY + 2 lettres du dépôt
    const baseCode = buildBaseReservationCode(point.name)
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
          sql`(${disponibilite.quantity} IS NULL) OR (COALESCE(${disponibilite.quantity}, 0) - ${disponibilite.reservedQuantity} >= ${quantity})`
        )
      )
      .returning({ id: disponibilite.id })

    if (reserved.length === 0) {
      return NextResponse.json(
        { error: "Stock insuffisant pour cette réservation" },
        { status: 409 }
      )
    }

    // La réservation est enregistrée et confirmée immédiatement : le règlement
    // se fait au dépôt, aucun paiement en ligne n'est initié.
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
        amount,
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

    // Le mécanisme de notification existant est déclenché dès l'enregistrement,
    // puisque la confirmation ne dépend plus d'un paiement en ligne.
    await createNotification({
      userId: currentUser.id,
      type: "reservation",
      title: "Réservation enregistrée",
      message: `Votre réservation ${reservationCode} est enregistrée. Montant à payer au dépôt : ${amount} FCFA.`,
      link: buildNotificationLink("reservation", reservationId, "client-reservations"),
    })

    await createNotification({
      userId: point.vendorId,
      type: "reservation",
      title: "Nouvelle réservation",
      message: `Réservation ${reservationCode} — ${quantity} bouteille${quantity > 1 ? "s" : ""} — montant à régler au dépôt : ${amount} FCFA.`,
      link: buildNotificationLink("reservation", reservationId, "vendor-reservations"),
    })

    return NextResponse.json({
      ok: true,
      reservation: {
        id: reservationId,
        code: reservationCode,
        status: "confirmed",
        expiresAt: expiresAt.toISOString(),
        amount,
        amountType,
        brand,
        format,
        quantity,
        pointName: point.name,
        pointDistrict: point.district ?? "",
        reservedAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    console.error("[reservation/create] error:", err)
    const message =
      err instanceof Error ? err.message : "Erreur lors de la réservation"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
