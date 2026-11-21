import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vendorSubscription, paymentTransaction, reservation, disponibilite, user } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { verifyWebhook } from "@/lib/geniuspay-webhook"
import { getPayment } from "@/lib/geniuspay"
import { createNotification, buildNotificationLink } from "@/lib/notifications"

function parseMetadata(value: unknown): Record<string, string> {
  if (!value) return {}
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => typeof entry === "string")
        .map(([key, entry]) => [key, entry as string])
    )
  }
  if (typeof value !== "string") return {}
  try {
    const parsed = JSON.parse(value)
    if (!parsed || typeof parsed !== "object") return {}
    return Object.fromEntries(
      Object.entries(parsed as Record<string, unknown>)
        .filter(([, entry]) => typeof entry === "string")
        .map(([key, entry]) => [key, entry as string])
    )
  } catch {
    return {}
  }
}

function isCompletedStatus(status: string): boolean {
  return status === "completed"
}

function isFailureStatus(status: string): boolean {
  return ["failed", "cancelled", "expired"].includes(status)
}

/**
 * POST /api/payment/webhook
 * Handle GeniusPay webhooks
 * 
 * Events handled:
 * - payment.success: Activate subscription
 * - payment.failed: Mark transaction failed
 * - payment.cancelled: Mark transaction cancelled
 * - payment.expired: Mark transaction expired
 * - payment.refunded: Handle refund
 */
export async function POST(req: NextRequest) {
  try {
    // Get raw body for signature verification
    const payload = await req.text()
    
    // Verify webhook
    let webhook
    try {
      webhook = verifyWebhook(payload, req.headers)
    } catch (verifyError) {
      console.error("[payment/webhook] Verification failed:", verifyError)
      return NextResponse.json(
        { error: "Invalid webhook signature" },
        { status: 401 }
      )
    }
    
    const { event, data } = webhook
    const { reference, status, metadata, id: geniuspayId, fees, net_amount, payment_method, provider, customer_name, customer_phone } = data

    console.log(`[payment/webhook] Received event: ${event} for reference: ${reference}`)

    // Find transaction by GeniusPay reference
    const [transaction] = await db
      .select()
      .from(paymentTransaction)
      .where(eq(paymentTransaction.geniuspayReference, reference))
      .limit(1)

    if (!transaction) {
      console.error(`[payment/webhook] Transaction not found for reference: ${reference}`)
      // Une transaction inconnue doit pouvoir être retentée par le provider.
      return NextResponse.json({ error: "Transaction introuvable" }, { status: 404 })
    }

    // Les métadonnées de la transaction locale sont la source de vérité.
    // Les métadonnées du webhook ne servent qu'à compléter les anciennes lignes.
    const transactionMetadata = parseMetadata(transaction.metadata)
    const webhookMetadata = parseMetadata(metadata)
    const mergedMetadata = { ...webhookMetadata, ...transactionMetadata }
    const vendorId = mergedMetadata.vendor_id
    if (!vendorId || vendorId !== transaction.vendorId) {
      console.error(`[payment/webhook] Vendor ID mismatch: metadata=${vendorId}, transaction=${transaction.vendorId}`)
      return NextResponse.json({ error: "Vendor mismatch" }, { status: 400 })
    }

    // Vérifier le statut auprès du provider avant toute transition métier.
    // Une réponse provider indisponible doit rester retentable.
    let verifiedStatus = status
    const verification = await getPayment(reference)
    if (!verification.success || !verification.data) {
      console.error(`[payment/webhook] Provider verification failed for ${reference}`)
      return NextResponse.json({ error: "Vérification du paiement indisponible" }, { status: 503 })
    }
    verifiedStatus = verification.data.status
    if (
      Number(verification.data.amount) !== Number(transaction.amount) ||
      verification.data.currency !== transaction.currency
    ) {
      console.error(`[payment/webhook] Amount or currency mismatch for ${reference}`)
      return NextResponse.json({ error: "Montant ou devise incohérent" }, { status: 400 })
    }
    console.log(`[payment/webhook] API verification: ${verifiedStatus} (webhook: ${status})`)
    
    // Update transaction record
    const updateData: Record<string, unknown> = {
      status: verifiedStatus,
      geniuspayId,
      fees,
      netAmount: net_amount,
      paymentMethod: payment_method,
      paymentProvider: provider,
      customerName: customer_name,
      customerPhone: customer_phone,
      webhookReceivedAt: new Date(),
      webhookVerified: true,
      updatedAt: new Date(),
    }
    
    // completed_at is not in webhook payload, will be set from API verification if needed
    
    await db
      .update(paymentTransaction)
      .set(updateData)
      .where(eq(paymentTransaction.id, transaction.id))
    
    // Détermination du type de paiement via les métadonnées canoniques
    const paymentType = mergedMetadata.type ?? "vendor_subscription"

    // Handle activation/désactivation selon le type de paiement et le statut
    // vérifié, et non selon le seul nom de l'événement.
    if (paymentType === "reservation") {
      if (isCompletedStatus(verifiedStatus)) {
        await handleReservationPaymentSuccess(reference, verifiedStatus)
      } else if (isFailureStatus(verifiedStatus)) {
        await handleReservationPaymentFailure(reference, verifiedStatus)
      }
    } else if (isCompletedStatus(verifiedStatus)) {
      await handlePaymentSuccess(vendorId, reference, verifiedStatus)
    } else if (isFailureStatus(verifiedStatus)) {
      await handlePaymentFailure(vendorId, reference, verifiedStatus)
    }
    
    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("[payment/webhook] Error:", err)
    // Return 200 to acknowledge receipt (GeniusPay will retry on 5xx)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}

async function handlePaymentSuccess(vendorId: string, reference: string, status: string) {
  // Only activate if status is completed
  if (status !== "completed") {
    console.log(`[payment/webhook] Payment not completed, status: ${status}`)
    return
  }
  
  // Check current subscription status to prevent double activation
  const [subscription] = await db
    .select()
    .from(vendorSubscription)
    .where(eq(vendorSubscription.vendorId, vendorId))
    .limit(1)
  
  if (subscription && subscription.status === "active") {
    console.log(`[payment/webhook] Subscription already active for vendor: ${vendorId}`)
    return
  }
  
  // Calculate subscription period (1 month from now)
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1)
  
  // Activate subscription
  await db
    .update(vendorSubscription)
    .set({
      status: "active",
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      lastPaymentAt: now,
      lastPaymentReference: reference,
      updatedAt: new Date(),
    })
    .where(eq(vendorSubscription.vendorId, vendorId))
  
  console.log(`[payment/webhook] Subscription activated for vendor: ${vendorId}`)
}

async function handlePaymentFailure(vendorId: string, reference: string, event: string) {
  // Update subscription to past_due or keep inactive
  const [subscription] = await db
    .select()
    .from(vendorSubscription)
    .where(eq(vendorSubscription.vendorId, vendorId))
    .limit(1)
  
  if (subscription) {
    await db
      .update(vendorSubscription)
      .set({
        status: "past_due",
        updatedAt: new Date(),
      })
      .where(eq(vendorSubscription.vendorId, vendorId))
  }
  
  console.log(`[payment/webhook] Payment failed (${event}) for vendor: ${vendorId}`)
}

/**
 * Confirme une réservation après succès de paiement.
 * Passe le statut de "pending" à "confirmed" uniquement si la réservation
 * existe encore et n'a pas déjà été traitée (évite les doubles confirmations).
 */
async function handleReservationPaymentSuccess(reference: string, status: string) {
  if (status !== "completed") {
    console.log(`[payment/webhook] Reservation payment not completed, status: ${status}`)
    return
  }

  const [transaction] = await db
    .select({
      metadata: paymentTransaction.metadata,
      vendorId: paymentTransaction.vendorId,
      amount: paymentTransaction.amount,
      currency: paymentTransaction.currency,
    })
    .from(paymentTransaction)
    .where(eq(paymentTransaction.geniuspayReference, reference))
    .limit(1)

  if (!transaction) {
    console.error(`[payment/webhook] Transaction not found for reference: ${reference}`)
    return
  }

  const meta = parseMetadata(transaction.metadata)
  const reservationId = meta.reservation_id
  const userId = meta.user_id
  if (!reservationId || !userId || meta.vendor_id !== transaction.vendorId) {
    console.error(`[payment/webhook] Missing or invalid reservation metadata for reference: ${reference}`)
    return
  }

  const [reservationRow] = await db
    .select({
      id: reservation.id,
      userId: reservation.userId,
      vendorId: reservation.vendorId,
      amount: reservation.amount,
    })
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1)

  if (
    !reservationRow ||
    reservationRow.userId !== userId ||
    reservationRow.vendorId !== transaction.vendorId ||
    Number(reservationRow.amount) !== Number(transaction.amount) ||
    (meta.amount && Number(meta.amount) !== Number(transaction.amount)) ||
    (meta.currency && meta.currency !== transaction.currency)
  ) {
    console.error(`[payment/webhook] Reservation metadata mismatch for reference: ${reference}`)
    return
  }

  // Mise à jour conditionnelle : seule une réservation "pending" peut passer en "confirmed"
  const [updated] = await db
    .update(reservation)
    .set({ status: "confirmed", updatedAt: new Date() })
    .where(and(eq(reservation.id, reservationId), eq(reservation.status, "pending")))
    .returning({ id: reservation.id, pointId: reservation.pointId })

  if (updated) {
    console.log(`[payment/webhook] Reservation confirmed: ${reservationId}`)
    
    // Créer notification pour le client
    await createNotification({
      userId,
      type: "reservation",
      title: "Réservation confirmée",
      message: `Votre réservation a été confirmée suite au paiement. Elle est maintenant prête à être récupérée.`,
      link: buildNotificationLink("reservation", reservationId, "client-reservations"),
    })
    
    // Créer notification pour le vendeur
    const [res] = await db
      .select({ vendorId: reservation.vendorId })
      .from(reservation)
      .where(eq(reservation.id, reservationId))
      .limit(1)
    
    if (res?.vendorId) {
      await createNotification({
        userId: res.vendorId,
        type: "reservation",
        title: "Nouvelle réservation confirmée",
        message: `Une nouvelle réservation a été confirmée et est prête pour récupération.`,
        link: buildNotificationLink("reservation", reservationId, "vendor-reservations"),
      })
    }
  } else {
    console.log(`[payment/webhook] Reservation not in pending state or already processed: ${reservationId}`)
  }
}

/**
 * Annule une réservation après échec de paiement et libère le stock réservé.
 */
async function handleReservationPaymentFailure(reference: string, event: string) {
  const [transaction] = await db
    .select({
      metadata: paymentTransaction.metadata,
      vendorId: paymentTransaction.vendorId,
      amount: paymentTransaction.amount,
      currency: paymentTransaction.currency,
    })
    .from(paymentTransaction)
    .where(eq(paymentTransaction.geniuspayReference, reference))
    .limit(1)

  if (!transaction) {
    console.error(`[payment/webhook] Transaction not found for reference: ${reference}`)
    return
  }

  const meta = parseMetadata(transaction.metadata)
  const reservationId = meta.reservation_id
  const userId = meta.user_id
  if (!reservationId || !userId || meta.vendor_id !== transaction.vendorId) {
    console.error(`[payment/webhook] Missing or invalid reservation metadata for reference: ${reference}`)
    return
  }

  // Récupère les infos de réservation avant annulation (pour libérer le stock)
  const [res] = await db
    .select({
      id: reservation.id,
      userId: reservation.userId,
      disponibiliteId: reservation.disponibiliteId,
      quantity: reservation.quantity,
      status: reservation.status,
      vendorId: reservation.vendorId,
      amount: reservation.amount,
    })
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1)

  if (
    !res ||
    res.userId !== userId ||
    res.vendorId !== transaction.vendorId ||
    Number(res.amount) !== Number(transaction.amount) ||
    (meta.amount && Number(meta.amount) !== Number(transaction.amount)) ||
    (meta.currency && meta.currency !== transaction.currency)
  ) {
    console.error(`[payment/webhook] Reservation metadata mismatch for reference: ${reference}`)
    return
  }

  if (res.status === "collected" || res.status === "cancelled") {
    console.log(`[payment/webhook] Reservation already ${res.status}, skipping failure handling: ${reservationId}`)
    return
  }

  // Annulation conditionnelle (pending → cancelled uniquement)
  const [cancelled] = await db
    .update(reservation)
    .set({ status: "cancelled", cancelledAt: new Date(), updatedAt: new Date() })
    .where(and(eq(reservation.id, reservationId), eq(reservation.status, "pending")))
    .returning({ id: reservation.id })

  if (cancelled) {
    // Créer notification pour le client
    await createNotification({
      userId,
      type: "reservation",
      title: "Réservation annulée",
      message: `Votre réservation a été annulée suite à l'échec du paiement.`,
      link: buildNotificationLink("reservation", reservationId, "client-reservations"),
    })
    
    // Créer notification pour le vendeur
    if (res.vendorId) {
      await createNotification({
        userId: res.vendorId,
        type: "reservation",
        title: "Réservation annulée",
        message: `Une réservation a été annulée suite à l'échec du paiement.`,
        link: buildNotificationLink("reservation", reservationId, "vendor-reservations"),
      })
    }
  }

  if (cancelled && res.disponibiliteId) {
    // Libération du stock réservé
    await db
      .update(disponibilite)
      .set({
        reservedQuantity: sql`GREATEST(0, ${disponibilite.reservedQuantity} - ${res.quantity})`,
        updatedAt: new Date(),
      })
      .where(eq(disponibilite.id, res.disponibiliteId))
    console.log(`[payment/webhook] Reservation cancelled and stock released: ${reservationId} (event: ${event})`)
  }
}