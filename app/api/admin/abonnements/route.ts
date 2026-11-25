import { NextResponse } from "next/server"
import { db } from "@/db"
import { user, vendorSubscription, paymentTransaction } from "@/db/schema"
import { eq, desc, count, ilike, or, inArray, and } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"

const SUBSCRIPTION_REFERENCE_AMOUNT = 5000 // FCFA

export async function GET(req: Request) {
  try {
    const staff = await requireModuleApi("abonnements")
    if (!staff) {
      return NextResponse.json({ error: "Accès réservé à l'administration" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20
    const status = searchParams.get("status") ?? "all"
    const search = searchParams.get("search") ?? ""

    // Build where conditions for vendors
    const vendorConditions = [eq(user.role, "vendor")]
    if (search) {
      vendorConditions.push(
        or(
          ilike(user.name, `%${search}%`),
          ilike(user.email, `%${search}%`)
        )
      )
    }

    // Get all vendors with their subscriptions
    const vendors = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phoneNumber,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(and(...vendorConditions))
      .orderBy(desc(user.createdAt))

    const vendorIds = vendors.map((v) => v.id)

    // Get subscriptions for these vendors
    let subscriptionsMap: Record<string, typeof vendorSubscription.$inferSelect | null> = {}
    let paymentsMap: Record<string, typeof paymentTransaction.$inferSelect[]> = {}

    if (vendorIds.length > 0) {
      // La table vendor_subscription peut ne pas exister encore dans toutes les
      // bases de données (migration en attente). On gère l'erreur de manière
      // gracieuse pour ne pas faire planter toute la page d'abonnements.
      let subscriptions: typeof vendorSubscription.$inferSelect[] = []
      try {
        subscriptions = await db
          .select()
          .from(vendorSubscription)
          .where(inArray(vendorSubscription.vendorId, vendorIds))
      } catch (err) {
        console.error("[admin/abonnements] vendor_subscription table missing:", err)
      }

      subscriptionsMap = subscriptions.reduce((acc, sub) => {
        acc[sub.vendorId] = sub
        return acc
      }, {} as Record<string, typeof vendorSubscription.$inferSelect>)

      // Get payment transactions for these vendors
      const payments = await db
        .select()
        .from(paymentTransaction)
        .where(and(inArray(paymentTransaction.vendorId, vendorIds), eq(paymentTransaction.environment, "live")))
        .orderBy(desc(paymentTransaction.createdAt))

      paymentsMap = payments.reduce((acc, payment) => {
        if (!acc[payment.vendorId]) {
          acc[payment.vendorId] = []
        }
        acc[payment.vendorId].push(payment)
        return acc
      }, {} as Record<string, typeof paymentTransaction.$inferSelect[]>)
    }

    // Combine data
    let combined = vendors.map((vendor) => {
      const subscription = subscriptionsMap[vendor.id] || null
      const payments = paymentsMap[vendor.id] || []
      const lastPayment = payments[0] || null

      // Determine effective status
      let effectiveStatus = "inactive"
      if (subscription) {
        effectiveStatus = subscription.status
      } else if (payments.some((p) => p.status === "completed")) {
        effectiveStatus = "active"
      }

      // Filter by status if needed
      if (status !== "all" && effectiveStatus !== status) {
        return null
      }

      return {
        vendor,
        subscription,
        lastPayment,
        paymentCount: payments.length,
        effectiveStatus,
        referenceAmount: SUBSCRIPTION_REFERENCE_AMOUNT,
      }
    }).filter(Boolean)

    // Pagination
    const total = combined.length
    combined = combined.slice((page - 1) * pageSize, page * pageSize)

    return NextResponse.json({
      abonnements: combined,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
      referenceAmount: SUBSCRIPTION_REFERENCE_AMOUNT,
    })
  } catch (err) {
    console.error("[admin/abonnements] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des abonnements" },
      { status: 500 }
    )
  }
}