import { NextResponse } from "next/server"
import { db } from "@/db"
import { vendorSubscription, paymentTransaction } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ reference: string }> }
) {
  try {
    const { reference } = await params

    if (!reference) {
      return NextResponse.json(
        { error: "Référence requise" },
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

    // Get subscription status
    const [subscription] = await db
      .select()
      .from(vendorSubscription)
      .where(eq(vendorSubscription.vendorId, transaction.vendorId))
      .limit(1)

    const isActive = subscription?.status === "active" &&
      subscription.currentPeriodEnd &&
      new Date(subscription.currentPeriodEnd) > new Date()

    return NextResponse.json({
      reference: transaction.geniuspayReference,
      status: transaction.status,
      subscription: subscription ? {
        status: subscription.status,
        isActive,
        currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      } : null,
    })
  } catch (err) {
    console.error("[payment/verify] Error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la vérification" },
      { status: 500 }
    )
  }
}