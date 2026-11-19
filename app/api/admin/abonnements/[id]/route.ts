import { NextResponse } from "next/server"
import { db } from "@/db"
import { user, vendorSubscription, paymentTransaction } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("abonnements")
    if (!staff) {
      return NextResponse.json({ error: "Accès réservé à l'administration" }, { status: 403 })
    }

    const { id } = await params

    // Get vendor info
    const vendor = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(and(eq(user.id, id), eq(user.role, "vendor")))
      .limit(1)

    if (vendor.length === 0) {
      return NextResponse.json({ error: "Vendeur non trouvé" }, { status: 404 })
    }

    // Get subscription
    const subscription = await db
      .select()
      .from(vendorSubscription)
      .where(eq(vendorSubscription.vendorId, id))
      .limit(1)

    // Get all payment transactions (both sandbox and live for full history)
    const payments = await db
      .select()
      .from(paymentTransaction)
      .where(eq(paymentTransaction.vendorId, id))
      .orderBy(desc(paymentTransaction.createdAt))

    // Calculate next due date
    let nextDueDate: Date | null = null
    if (subscription[0]?.currentPeriodEnd) {
      nextDueDate = new Date(subscription[0].currentPeriodEnd)
    } else if (subscription[0]?.lastPaymentAt) {
      // Estimate: 1 month from last payment
      nextDueDate = new Date(subscription[0].lastPaymentAt)
      nextDueDate.setMonth(nextDueDate.getMonth() + 1)
    }

    return NextResponse.json({
      vendor: vendor[0],
      subscription: subscription[0] || null,
      payments,
      nextDueDate: nextDueDate?.toISOString() || null,
      referenceAmount: 5000,
    })
  } catch (err) {
    console.error("[admin/abonnements/[id]] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des détails de l'abonnement" },
      { status: 500 }
    )
  }
}