import { NextResponse } from "next/server"
import { db } from "@/db"
import { vendorSubscription } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireUser } from "@/lib/session"

/**
 * GET /api/vendor/subscription
 * Get current vendor's subscription status
 */
export async function GET() {
  try {
    const user = await requireUser()
    
    if (user.role !== "vendor") {
      return NextResponse.json(
        { error: "Réservé aux vendeurs" },
        { status: 403 }
      )
    }
    
    const [subscription] = await db
      .select()
      .from(vendorSubscription)
      .where(eq(vendorSubscription.vendorId, user.id))
      .limit(1)
    
    if (!subscription) {
      return NextResponse.json({
        status: "none",
        isActive: false,
        currentPeriodEnd: null,
        lastPaymentAt: null,
        amount: 5000,
        currency: "XAF",
      })
    }
    
    const isActive = subscription.status === "active" && 
      subscription.currentPeriodEnd && 
      new Date(subscription.currentPeriodEnd) > new Date()
    
    return NextResponse.json({
      status: subscription.status,
      isActive,
      currentPeriodStart: subscription.currentPeriodStart?.toISOString() ?? null,
      currentPeriodEnd: subscription.currentPeriodEnd?.toISOString() ?? null,
      lastPaymentAt: subscription.lastPaymentAt?.toISOString() ?? null,
      lastPaymentReference: subscription.lastPaymentReference ?? null,
      amount: subscription.amount,
      currency: subscription.currency,
      cancelledAt: subscription.cancelledAt?.toISOString() ?? null,
    })
  } catch (err) {
    console.error("[api/vendor/subscription] Error:", err)
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    )
  }
}