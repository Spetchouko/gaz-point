import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vendorSubscription, paymentTransaction, reservation, disponibilite } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"
import { verifyWebhook, isPaymentCompletedEvent, isPaymentFailedEvent, extractVendorIdFromMetadata } from "@/lib/geniuspay-webhook"
import { getPayment } from "@/lib/geniuspay"

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
    
    const { event, data, environment: webhookEnvironment } = webhook
    const { reference, status, metadata, id: geniuspayId, amount, currency, fees, net_amount, payment_method, provider, customer_name, customer_phone } = data
    
    console.log(`[payment/webhook] Received event: ${event} for reference: ${reference}`)
    
    // Find transaction by GeniusPay reference
    const [transaction] = await db
      .select()
      .from(paymentTransaction)
      .where(eq(paymentTransaction.geniuspayReference, reference))
      .limit(1)
    
    if (!transaction) {
      console.error(`[payment/webhook] Transaction not found for reference: ${reference}`)
      // Don't return 404 - acknowledge receipt to prevent retries
      return NextResponse.json({ received: true })
    }
    
    // Extract vendor ID from metadata
    const vendorId = extractVendorIdFromMetadata(metadata)
    if (!vendorId || vendorId !== transaction.vendorId) {
      console.error(`[payment/webhook] Vendor ID mismatch: metadata=${vendorId}, transaction=${transaction.vendorId}`)
      return NextResponse.json({ error: "Vendor mismatch" }, { status: 400 })
    }
    
    // Verify payment status with GeniusPay API (defense in depth)
    let verifiedStatus = status
    if (isPaymentCompletedEvent(event) || isPaymentFailedEvent(event)) {
      const verification = await getPayment(reference)
      if (verification.success && verification.data) {
        verifiedStatus = verification.data.status
        console.log(`[payment/webhook] API verification: ${verifiedStatus} (webhook: ${status})`)
      }
    }
    
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
    
    // Détermination du type de paiement via les métadonnées
    const paymentType = metadata?.type ?? "vendor_subscription"

    // Handle activation/désactivation selon le type de paiement
    if (paymentType === "reservation") {
      if (isPaymentCompletedEvent(event)) {
        await handleReservationPaymentSuccess(reference, verifiedStatus)
      } else if (isPaymentFailedEvent(event)) {
        await handleReservationPaymentFailure(reference, event)
      }
    } else {
      if (isPaymentCompletedEvent(event)) {
        await handlePaymentSuccess(vendorId, reference, verifiedStatus)
      } else if (isPaymentFailedEvent(event)) {
        await handlePaymentFailure(vendorId, reference, event)
      }
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
    .select({ metadata: paymentTransaction.metadata })
    .from(paymentTransaction)
    .where(eq(paymentTransaction.geniuspayReference, reference))
    .limit(1)

  if (!transaction) {
    console.error(`[payment/webhook] Transaction not found for reference: ${reference}`)
    return
  }

  let meta: Record<string, string> = {}
  try {
    meta = JSON.parse(transaction.metadata ?? "{}")
  } catch {
    console.error(`[payment/webhook] Invalid metadata for transaction: ${reference}`)
    return
  }

  const reservationId = meta.reservation_id
  if (!reservationId) {
    console.error(`[payment/webhook] No reservation_id in metadata for reference: ${reference}`)
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
  } else {
    console.log(`[payment/webhook] Reservation not in pending state or already processed: ${reservationId}`)
  }
}

/**
 * Annule une réservation après échec de paiement et libère le stock réservé.
 */
async function handleReservationPaymentFailure(reference: string, event: string) {
  const [transaction] = await db
    .select({ metadata: paymentTransaction.metadata })
    .from(paymentTransaction)
    .where(eq(paymentTransaction.geniuspayReference, reference))
    .limit(1)

  if (!transaction) {
    console.error(`[payment/webhook] Transaction not found for reference: ${reference}`)
    return
  }

  let meta: Record<string, string> = {}
  try {
    meta = JSON.parse(transaction.metadata ?? "{}")
  } catch {
    console.error(`[payment/webhook] Invalid metadata for transaction: ${reference}`)
    return
  }

  const reservationId = meta.reservation_id
  if (!reservationId) {
    console.error(`[payment/webhook] No reservation_id in metadata for reference: ${reference}`)
    return
  }

  // Récupère les infos de réservation avant annulation (pour libérer le stock)
  const [res] = await db
    .select({
      id: reservation.id,
      disponibiliteId: reservation.disponibiliteId,
      quantity: reservation.quantity,
      status: reservation.status,
    })
    .from(reservation)
    .where(eq(reservation.id, reservationId))
    .limit(1)

  if (!res) {
    console.error(`[payment/webhook] Reservation not found: ${reservationId}`)
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