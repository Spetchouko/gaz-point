import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { paymentTransaction, vendorSubscription } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireUser } from "@/lib/session"
import { getPayment } from "@/lib/geniuspay"

function parseMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== "string") return {}
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

/**
 * GET /api/payment/verify/[reference]
 * Verify payment status with GeniusPay API
 * 
 * Used by success page to confirm payment before activating subscription
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const user = await requireUser()
    const { reference } = await params
    
    if (!reference || !reference.startsWith("MTX-")) {
      return NextResponse.json(
        { error: "Référence invalide" },
        { status: 400 }
      )
    }
    
    // Find transaction
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
    
    // Le principal autorisé dépend du type de transaction. Une réservation
    // appartient au client payeur, pas au vendeur bénéficiaire.
    const metadata = parseMetadata(transaction.metadata)
    const paymentType = metadata.type ?? "vendor_subscription"
    const isOwner =
      paymentType === "reservation"
        ? metadata.user_id === user.id
        : transaction.vendorId === user.id
    if (!isOwner && user.role !== "admin") {
      return NextResponse.json(
        { error: "Non autorisé" },
        { status: 403 }
      )
    }
    
    // Verify with GeniusPay API
    const result = await getPayment(reference)
    
    if (!result.success || !result.data) {
      return NextResponse.json(
        { error: result.error?.message ?? "Échec de la vérification" },
        { status: 500 }
      )
    }
    
    const payment = result.data
    
    // Update local transaction record with verified data
    await db
      .update(paymentTransaction)
      .set({
        status: payment.status,
        fees: payment.fees,
        netAmount: payment.net_amount,
        paymentMethod: payment.payment_method,
        paymentProvider: payment.payment_provider,
        completedAt: payment.completed_at ? new Date(payment.completed_at) : null,
        updatedAt: new Date(),
      })
      .where(eq(paymentTransaction.id, transaction.id))
    
    // If payment completed and this is a subscription, activate it.
    // A reservation remains pending until the signed webhook confirms it.
    if (payment.status === "completed" && paymentType !== "reservation") {
      const [subscription] = await db
        .select()
        .from(vendorSubscription)
        .where(eq(vendorSubscription.vendorId, transaction.vendorId))
        .limit(1)
      
      if (subscription && subscription.status !== "active") {
        const now = new Date()
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + 1)
        
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
          .where(eq(vendorSubscription.vendorId, transaction.vendorId))
      }
    }
    
    return NextResponse.json({
      reference: payment.reference,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      fees: payment.fees,
      netAmount: payment.net_amount,
      paymentMethod: payment.payment_method,
      paymentProvider: payment.payment_provider,
      completedAt: payment.completed_at,
      metadata: payment.metadata,
      paymentType,
    })
  } catch (err) {
    console.error("[payment/verify] Error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    )
  }
}