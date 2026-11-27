import { db } from "@/db"
import { vendorSubscription } from "@/db/schema"
import { eq } from "drizzle-orm"
import { withTransientRetry } from "@/lib/transient-retry"

export interface VendorSubscriptionStatus {
  hasSubscription: boolean
  isActive: boolean
  status: string
  currentPeriodEnd: Date | null
  lastPaymentAt: Date | null
  amount: number
  currency: string
}

/**
 * Check if a vendor has an active subscription
 * Returns subscription status details
 */
export async function getVendorSubscriptionStatus(vendorId: string): Promise<VendorSubscriptionStatus> {
  try {
    const [subscription] = await withTransientRetry(() =>
      db
        .select()
        .from(vendorSubscription)
        .where(eq(vendorSubscription.vendorId, vendorId))
        .limit(1)
    )

    if (!subscription) {
      return {
        hasSubscription: false,
        isActive: false,
        status: "none",
        currentPeriodEnd: null,
        lastPaymentAt: null,
        amount: 5000,
        currency: "XAF",
      }
    }

    const isActive: boolean = subscription.status === "active" &&
      subscription.currentPeriodEnd !== null &&
      new Date(subscription.currentPeriodEnd) > new Date()

    return {
      hasSubscription: true,
      isActive,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null,
      lastPaymentAt: subscription.lastPaymentAt ? new Date(subscription.lastPaymentAt) : null,
      amount: subscription.amount,
      currency: subscription.currency,
    }
  } catch (err) {
    console.error("[vendor-subscription] Error checking subscription:", err)
    // On error, assume no active subscription to be safe
    return {
      hasSubscription: false,
      isActive: false,
      status: "error",
      currentPeriodEnd: null,
      lastPaymentAt: null,
      amount: 5000,
      currency: "XAF",
    }
  }
}

/**
 * Check if vendor can access dashboard (has active subscription or admin exemption)
 * Admin exemption is handled by checking if subscription was granted by admin
 * (status === 'active' with no payment reference or special flag)
 */
export async function canVendorAccessDashboard(vendorId: string): Promise<{ allowed: boolean; reason?: string }> {
  const status = await getVendorSubscriptionStatus(vendorId)
  
  if (status.isActive) {
    return { allowed: true }
  }

  // Check if subscription exists but is past_due or inactive
  if (status.hasSubscription) {
    return { 
      allowed: false, 
      reason: status.status === "past_due" 
        ? "Votre abonnement est en retard. Veuillez le renouveler pour accéder à votre espace vendeur."
        : "Votre abonnement n'est pas actif. Veuillez souscrire pour accéder à votre espace vendeur."
    }
  }

  return { 
    allowed: false, 
    reason: "Aucun abonnement actif. Veuillez souscrire pour accéder à votre espace vendeur."
  }
}