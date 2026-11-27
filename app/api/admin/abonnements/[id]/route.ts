import { NextResponse } from "next/server"
import { db } from "@/db"
import { user, vendorSubscription, paymentTransaction } from "@/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"
import { createNotification, buildNotificationLink } from "@/lib/notifications"
import { randomUUID } from "node:crypto"

const SUBSCRIPTION_AMOUNT = 5000
const SUBSCRIPTION_CURRENCY = "XAF"

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

interface AdminSubscriptionAction {
  action: "grant" | "extend" | "cancel" | "reactivate"
  durationMonths?: number // for grant/extend
  reason?: string
}

/**
 * PATCH /api/admin/abonnements/[id]
 * Admin actions on vendor subscription:
 * - grant: Grant free subscription (admin exemption)
 * - extend: Extend current subscription
 * - cancel: Cancel subscription
 * - reactivate: Reactivate cancelled subscription
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("abonnements")
    if (!staff) {
      return NextResponse.json({ error: "Accès réservé à l'administration" }, { status: 403 })
    }

    const { id } = await params
    const body = await req.json().catch(() => null) as AdminSubscriptionAction | null

    if (!body?.action) {
      return NextResponse.json({ error: "Action requise" }, { status: 400 })
    }

    const { action, durationMonths = 1, reason } = body

    // Get vendor info
    const vendor = await db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
      })
      .from(user)
      .where(and(eq(user.id, id), eq(user.role, "vendor")))
      .limit(1)

    if (vendor.length === 0) {
      return NextResponse.json({ error: "Vendeur non trouvé" }, { status: 404 })
    }

    const vendorData = vendor[0]

    // Get current subscription
    const [subscription] = await db
      .select()
      .from(vendorSubscription)
      .where(eq(vendorSubscription.vendorId, id))
      .limit(1)

    const now = new Date()

    switch (action) {
      case "grant": {
        // Grant free subscription (admin exemption)
        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + durationMonths)

        const adminReference = `ADMIN-${randomUUID().substring(0, 8).toUpperCase()}`

        if (!subscription) {
          await db.insert(vendorSubscription).values({
            id: randomUUID(),
            vendorId: id,
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            lastPaymentAt: now,
            lastPaymentReference: adminReference,
            amount: 0, // Free - admin granted
            currency: SUBSCRIPTION_CURRENCY,
            createdAt: now,
            updatedAt: now,
          })
        } else {
          await db
            .update(vendorSubscription)
            .set({
              status: "active",
              currentPeriodStart: now,
              currentPeriodEnd: periodEnd,
              lastPaymentAt: now,
              lastPaymentReference: adminReference,
              amount: 0,
              cancelledAt: null,
              updatedAt: now,
            })
            .where(eq(vendorSubscription.vendorId, id))
        }

        // Create notification for vendor
        await createNotification({
          userId: id,
          type: "system",
          title: "Abonnement offert par l'administration",
          message: `Votre abonnement vendeur a été activé gratuitement pour ${durationMonths} mois par l'équipe GazPoints.${reason ? ` Raison : ${reason}` : ""}`,
          link: buildNotificationLink("system", id, "profil"),
        })

        // Log admin action
        await db.insert(paymentTransaction).values({
          id: randomUUID(),
          vendorId: id,
          geniuspayReference: adminReference,
          geniuspayId: null,
          amount: 0,
          currency: SUBSCRIPTION_CURRENCY,
          fees: 0,
          netAmount: 0,
          status: "completed",
          paymentMethod: "admin_grant",
          paymentProvider: "admin",
          customerName: vendorData.name,
          customerEmail: vendorData.email,
          checkoutUrl: null,
          successUrl: null,
          errorUrl: null,
          metadata: JSON.stringify({
            type: "vendor_subscription",
            vendor_id: id,
            vendor_email: vendorData.email,
            plan: "monthly",
            amount: "0",
            currency: SUBSCRIPTION_CURRENCY,
            admin_grant: "true",
            admin_id: staff.user.id,
            duration_months: String(durationMonths),
            reason: reason || "",
          }),
          environment: "sandbox",
          initiatedAt: now,
          completedAt: now,
          webhookReceivedAt: now,
          webhookVerified: true,
        })

        return NextResponse.json({ ok: true, message: `Abonnement offert pour ${durationMonths} mois` })
      }

      case "extend": {
        if (!subscription) {
          return NextResponse.json({ error: "Aucun abonnement à prolonger" }, { status: 400 })
        }

        const currentEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : now
        const newEnd = new Date(currentEnd)
        newEnd.setMonth(newEnd.getMonth() + durationMonths)

        await db
          .update(vendorSubscription)
          .set({
            currentPeriodEnd: newEnd,
            status: "active",
            updatedAt: now,
          })
          .where(eq(vendorSubscription.vendorId, id))

        // Create notification for vendor
        await createNotification({
          userId: id,
          type: "system",
          title: "Abonnement prolongé",
          message: `Votre abonnement a été prolongé de ${durationMonths} mois par l'administration. Nouvelle échéance : ${newEnd.toLocaleDateString("fr-FR")}.${reason ? ` Raison : ${reason}` : ""}`,
          link: buildNotificationLink("system", id, "profil"),
        })

        return NextResponse.json({ ok: true, message: `Abonnement prolongé de ${durationMonths} mois` })
      }

      case "cancel": {
        if (!subscription) {
          return NextResponse.json({ error: "Aucun abonnement à annuler" }, { status: 400 })
        }

        await db
          .update(vendorSubscription)
          .set({
            status: "cancelled",
            cancelledAt: now,
            updatedAt: now,
          })
          .where(eq(vendorSubscription.vendorId, id))

        // Create notification for vendor
        await createNotification({
          userId: id,
          type: "system",
          title: "Abonnement annulé",
          message: `Votre abonnement a été annulé par l'administration.${reason ? ` Raison : ${reason}` : ""}`,
          link: buildNotificationLink("system", id, "profil"),
        })

        return NextResponse.json({ ok: true, message: "Abonnement annulé" })
      }

      case "reactivate": {
        if (!subscription) {
          return NextResponse.json({ error: "Aucun abonnement à réactiver" }, { status: 400 })
        }

        const periodEnd = new Date(now)
        periodEnd.setMonth(periodEnd.getMonth() + durationMonths)

        await db
          .update(vendorSubscription)
          .set({
            status: "active",
            currentPeriodStart: now,
            currentPeriodEnd: periodEnd,
            lastPaymentAt: now,
            lastPaymentReference: `ADMIN-${randomUUID().substring(0, 8).toUpperCase()}`,
            cancelledAt: null,
            updatedAt: now,
          })
          .where(eq(vendorSubscription.vendorId, id))

        // Create notification for vendor
        await createNotification({
          userId: id,
          type: "system",
          title: "Abonnement réactivé",
          message: `Votre abonnement a été réactivé par l'administration pour ${durationMonths} mois.${reason ? ` Raison : ${reason}` : ""}`,
          link: buildNotificationLink("system", id, "profil"),
        })

        return NextResponse.json({ ok: true, message: `Abonnement réactivé pour ${durationMonths} mois` })
      }

      default:
        return NextResponse.json({ error: "Action non reconnue" }, { status: 400 })
    }
  } catch (err) {
    console.error("[admin/abonnements/[id]] PATCH error:", err)
    return NextResponse.json(
      { error: "Erreur lors de l'action sur l'abonnement" },
      { status: 500 }
    )
  }
}