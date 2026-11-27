import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { vendorSubscription, paymentTransaction, user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { createNotification, buildNotificationLink } from "@/lib/notifications"
import { randomUUID } from "node:crypto"

type DemoResultType = "completed" | "failed" | "cancelled"

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
  return ["failed", "cancelled"].includes(status)
}

/**
 * POST /api/payment/demo/verify
 * Simulate webhook processing for DEMO payment
 * 
 * Body: { reference, resultType }
 * Returns: { success: true }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null) as { reference?: string; resultType?: DemoResultType } | null
    
    if (!body?.reference || !body?.resultType) {
      return NextResponse.json(
        { error: "Référence et type de résultat requis" },
        { status: 400 }
      )
    }

    const { reference, resultType } = body

    if (!["completed", "failed", "cancelled"].includes(resultType)) {
      return NextResponse.json(
        { error: "Type de résultat invalide" },
        { status: 400 }
      )
    }

    // Find transaction by reference
    const [transaction] = await db
      .select()
      .from(paymentTransaction)
      .where(eq(paymentTransaction.geniuspayReference, reference))
      .limit(1)

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction introuvable" },
        { status: 404 }
      )
    }

    // Verify this is a DEMO transaction
    const metadata = parseMetadata(transaction.metadata)
    if (metadata.demo_mode !== "true") {
      return NextResponse.json(
        { error: "Transaction non-DEMO" },
        { status: 400 }
      )
    }

    const vendorId = metadata.vendor_id
    if (!vendorId || vendorId !== transaction.vendorId) {
      return NextResponse.json(
        { error: "Vendor mismatch" },
        { status: 400 }
      )
    }

    // Update transaction record with simulated result
    const now = new Date()
    const verifiedStatus = resultType === "completed" ? "completed" : resultType
    
    await db
      .update(paymentTransaction)
      .set({
        status: verifiedStatus,
        fees: 0,
        netAmount: SUBSCRIPTION_AMOUNT,
        paymentMethod: resultType === "completed" ? "mtn_money" : resultType === "failed" ? "orange_money" : "cancelled",
        paymentProvider: "demo",
        webhookReceivedAt: now,
        webhookVerified: true,
        completedAt: resultType === "completed" ? now : null,
        updatedAt: now,
      })
      .where(eq(paymentTransaction.id, transaction.id))

    // Handle subscription activation/failure based on result
    if (resultType === "completed") {
      await handleDemoPaymentSuccess(vendorId, reference)
    } else {
      await handleDemoPaymentFailure(vendorId, reference, resultType)
    }

    return NextResponse.json({ success: true, status: verifiedStatus })
  } catch (err) {
    console.error("[payment/demo/verify] Error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la vérification DEMO" },
      { status: 500 }
    )
  }
}

const SUBSCRIPTION_AMOUNT = 5000

async function handleDemoPaymentSuccess(vendorId: string, reference: string) {
  // Check current subscription status to prevent double activation
  const [subscription] = await db
    .select()
    .from(vendorSubscription)
    .where(eq(vendorSubscription.vendorId, vendorId))
    .limit(1)

  if (subscription && subscription.status === "active") {
    console.log(`[payment/demo/verify] Subscription already active for vendor: ${vendorId}`)
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
      updatedAt: now,
    })
    .where(eq(vendorSubscription.vendorId, vendorId))

  // Create notification for vendor
  try {
    const [vendor] = await db
      .select({ name: user.name })
      .from(user)
      .where(eq(user.id, vendorId))
      .limit(1)

    await createNotification({
      userId: vendorId,
      type: "system",
      title: "Abonnement activé",
      message: `Votre abonnement mensuel vendeur (${SUBSCRIPTION_AMOUNT} FCFA) a été activé avec succès. Vous avez maintenant accès à toutes les fonctionnalités.`,
      link: buildNotificationLink("system", vendorId, "profil"),
    })
  } catch {
    // Ignore notification errors
  }

  console.log(`[payment/demo/verify] DEMO subscription activated for vendor: ${vendorId}`)
}

async function handleDemoPaymentFailure(vendorId: string, reference: string, resultType: "failed" | "cancelled") {
  const [subscription] = await db
    .select()
    .from(vendorSubscription)
    .where(eq(vendorSubscription.vendorId, vendorId))
    .limit(1)

  if (subscription) {
    await db
      .update(vendorSubscription)
      .set({
        status: "inactive",
        updatedAt: new Date(),
      })
      .where(eq(vendorSubscription.vendorId, vendorId))
  }

  // Create notification for vendor
  try {
    await createNotification({
      userId: vendorId,
      type: "system",
      title: resultType === "cancelled" ? "Paiement annulé" : "Paiement échoué",
      message: resultType === "cancelled"
        ? "Votre paiement d'abonnement a été annulé. Vous pouvez réessayer à tout moment."
        : "Votre paiement d'abonnement a échoué. Veuillez réessayer ou contacter le support.",
      link: buildNotificationLink("system", vendorId, "profil"),
    })
  } catch {
    // Ignore notification errors
  }

  console.log(`[payment/demo/verify] DEMO payment ${resultType} for vendor: ${vendorId}`)
}