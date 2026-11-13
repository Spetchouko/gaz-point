import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { reservation, disponibilite, pointDeVente, user, paymentTransaction } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { getCurrentUser } from "@/lib/session"
import {
  AD_ATTRIBUTION_COOKIE,
  recordConversionFromRequest,
} from "@/lib/publicite-attribution"
import { sendNewConsignationEmail } from "@/lib/email"
import { generateReservationQRCode } from "@/lib/qrcode"
import { initiatePayment } from "@/lib/geniuspay"
import { optionalEnv } from "@/lib/env"

const DEFAULT_RESERVATION_AMOUNT = 1000 // FCFA
const RESERVATION_EXPIRY_MINUTES = 1440 // 24 heures
const MAX_RESERVATION_QUANTITY = 20
const RESERVATION_PAYMENT_CODE_LENGTH = 10

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789" // sans 0,1,O,I,L,S pour éviter les confusions

/**
 * Génère un code de réservation au format GP + DDMMYY + 2 premières lettres du dépôt.
 * Exemple : dépôt "Total Bonamoussadi" le 13/11/26 → GP131126TO (10 caractères).
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

  return `GP${datePart}${depotLetters}` // GP (2) + DDMMYY (6) + 2 lettres = 10 caractères
}

async function ensureUniqueCode(baseCode: string): Promise<string> {
  let code = baseCode
  let attempts = 0
  while (attempts < RESERVATION_PAYMENT_CODE_LENGTH) {
    const existing = await db
      .select({ id: reservation.id })
      .from(reservation)
      .where(eq(reservation.reservationCode, code))
      .limit(1)
    if (!existing || existing.length === 0) return code
    // Variante : remplace le dernier caractère par un chiffre pour garder le format 10 chars
    code = baseCode.slice(0, -1) + String(attempts % 10)
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

    const [point] = await db
      .select({
        name: pointDeVente.name,
        district: pointDeVente.district,
        vendorId: pointDeVente.vendorId,
        vendorEmail: user.email,
      })
      .from(pointDeVente)
      .leftJoin(user, eq(pointDeVente.vendorId, user.id))
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

    // Insertion de la réservation en statut "pending" : elle ne devient
    // confirmée qu'après réception d'une confirmation de paiement valide
    // (webhook GeniusPay). Un simple retour de page ne vaut pas preuve de paiement.
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
        status: "pending",
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

    // Enregistrement de la transaction de paiement en attente
    const paymentId = randomUUID()
    const siteUrl = optionalEnv("NEXT_PUBLIC_SITE_URL") ?? "http://localhost:3000"
    const successUrl = `${siteUrl}/paiement/succes`
    const errorUrl = `${siteUrl}/paiement/echec`

    // Initiation du paiement GeniusPay (1 000 FCFA fixes)
    const paymentResult = await initiatePayment({
      amount: DEFAULT_RESERVATION_AMOUNT,
      currency: "XAF",
      description: `Réservation gaz ${brand} ${format} - ${point.name}`,
      customer: {
        name: currentUser.name,
        email: currentUser.email ?? "",
        phone: currentUser.phoneNumber ?? undefined,
        country: "CM",
      },
      successUrl,
      errorUrl,
      metadata: {
        type: "reservation",
        reservation_id: reservationId,
        user_id: currentUser.id,
        amount: String(DEFAULT_RESERVATION_AMOUNT),
      },
    })

    if (!paymentResult.success || !paymentResult.data) {
      console.error("[reservation/create] GeniusPay error:", paymentResult.error)
      // Annulation de la réservation et libération du stock en cas d'échec d'initiation
      await db
        .update(reservation)
        .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
        .where(eq(reservation.id, reservationId))
      await db
        .update(disponibilite)
        .set({
          reservedQuantity: sql`GREATEST(0, ${disponibilite.reservedQuantity} - ${quantity})`,
          updatedAt: new Date(),
        })
        .where(eq(disponibilite.id, targetDisponibiliteId))
      return NextResponse.json(
        {
          error: paymentResult.error?.message ?? "Échec de l'initialisation du paiement",
        },
        { status: 500 }
      )
    }

    // Stockage de la transaction de paiement
    await db.insert(paymentTransaction).values({
      id: paymentId,
      vendorId: point.vendorId,
      geniuspayReference: paymentResult.data.reference,
      geniuspayId: paymentResult.data.id,
      amount: paymentResult.data.amount,
      currency: paymentResult.data.currency,
      status: paymentResult.data.status,
      checkoutUrl: paymentResult.data.checkout_url,
      successUrl,
      errorUrl,
      metadata: JSON.stringify(paymentResult.data.metadata),
      environment: paymentResult.data.environment,
      initiatedAt: new Date(),
    })

    // Attribution publicitaire : réservation faite dans les 30 jours après un clic.
    if (req.cookies.get(AD_ATTRIBUTION_COOKIE)) {
      await recordConversionFromRequest(req, "reservation", { userId: currentUser.id })
    }

    return NextResponse.json({
      ok: true,
      reservation: {
        id: reservationId,
        code: reservationCode,
        status: "pending",
        expiresAt: expiresAt.toISOString(),
        amount: DEFAULT_RESERVATION_AMOUNT,
        amountType,
        brand,
        format,
        quantity,
        pointName: point.name,
        pointDistrict: point.district ?? "",
        reservedAt: new Date().toISOString(),
      },
      payment: {
        checkoutUrl: paymentResult.data.checkout_url,
        reference: paymentResult.data.reference,
      },
    })
  } catch (err) {
    console.error("[reservation/create] error:", err)
    const message =
      err instanceof Error ? err.message : "Erreur lors de la réservation"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
