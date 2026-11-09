import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vendorSubscription, paymentTransaction } from "@/db/schema"
import { eq } from "drizzle-orm"
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
    
    // Handle subscription activation/deactivation based on event
    if (isPaymentCompletedEvent(event)) {
      await handlePaymentSuccess(vendorId, reference, verifiedStatus)
    } else if (isPaymentFailedEvent(event)) {
      await handlePaymentFailure(vendorId, reference, event)
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