import { db } from "@/db"
import { vendorSubscription } from "@/db/schema"
import { eq } from "drizzle-orm"
import { withTransientRetry } from "@/lib/transient-retry"

/**
 * Wrapper avec timeout pour chaque tentative de requête DB.
 */
async function withTimeoutPerAttempt<T>(
  operation: () => Promise<T>,
  ms: number
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout après ${ms}ms`)), ms)
    ),
  ])
}

export type VendorAccessStatus =
  | "allowed"
  | "unauthenticated"
  | "not_vendor"
  | "subscription_none"
  | "subscription_pending"
  | "subscription_past_due"
  | "subscription_expired"
  | "subscription_cancelled"
  | "error"

export interface VendorAccessDecision {
  status: VendorAccessStatus
  vendorId?: string
  subscriptionStatus?: string
  currentPeriodEnd?: Date | null
  message?: string
  redirectTo?: string
}

/**
 * Vérifie si un vendeur a accès à son dashboard
 * États gérés:
 * - allowed: abonnement actif
 * - subscription_none: aucun abonnement
 * - subscription_pending: paiement en cours de traitement
 * - subscription_past_due: abonnement en retard
 * - subscription_expired: abonnement expiré
 * - subscription_cancelled: abonnement annulé
 * - not_vendor: rôle différent de vendor
 * - unauthenticated: pas de session
 * - error: erreur technique
 */
export async function checkVendorAccess(vendorId: string): Promise<VendorAccessDecision> {
  try {
    const [subscription] = await withTransientRetry(async () =>
      withTimeoutPerAttempt(
        () =>
          db
            .select()
            .from(vendorSubscription)
            .where(eq(vendorSubscription.vendorId, vendorId))
            .limit(1),
        10000
      ),
      { attempts: 3, delayMs: 250 }
    )

    if (!subscription) {
      return {
        status: "subscription_none",
        vendorId,
        subscriptionStatus: "none",
        currentPeriodEnd: null,
        message: "Aucun abonnement actif. Veuillez souscrire pour accéder à votre espace vendeur.",
        redirectTo: "/paiement/abonnement",
      }
    }

    const now = new Date()
    const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd) : null
    const isActive = subscription.status === "active" && periodEnd && periodEnd > now

    // Abonnement actif et valide
    if (isActive) {
      return {
        status: "allowed",
        vendorId,
        subscriptionStatus: subscription.status,
        currentPeriodEnd: periodEnd,
      }
    }

    // Abonnement existe mais pas actif
    switch (subscription.status) {
      case "pending":
      case "processing":
        return {
          status: "subscription_pending",
          vendorId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd,
          message: "Votre paiement est en cours de traitement. L'accès sera activé automatiquement après confirmation.",
          redirectTo: "/paiement/succes",
        }
      case "past_due":
        return {
          status: "subscription_past_due",
          vendorId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd,
          message: "Votre abonnement est en retard. Veuillez le renouveler pour accéder à votre espace vendeur.",
          redirectTo: "/paiement/abonnement",
        }
      case "expired":
        return {
          status: "subscription_expired",
          vendorId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd,
          message: "Votre abonnement a expiré. Veuillez le renouveler pour accéder à votre espace vendeur.",
          redirectTo: "/paiement/abonnement",
        }
      case "cancelled":
        return {
          status: "subscription_cancelled",
          vendorId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd,
          message: "Votre abonnement a été annulé. Veuillez souscrire à nouveau pour accéder à votre espace vendeur.",
          redirectTo: "/paiement/abonnement",
        }
      case "inactive":
      default:
        return {
          status: "subscription_none",
          vendorId,
          subscriptionStatus: subscription.status,
          currentPeriodEnd: periodEnd,
          message: "Aucun abonnement actif. Veuillez souscrire pour accéder à votre espace vendeur.",
          redirectTo: "/paiement/abonnement",
        }
    }
  } catch (err) {
    console.error("[vendor-access] Erreur vérification abonnement:", err)
    return {
      status: "error",
      vendorId,
      message: "Impossible de vérifier votre abonnement pour le moment. Veuillez réessayer.",
      redirectTo: "/paiement/abonnement",
    }
  }
}

/**
 * Version pour Route Handlers (retourne null au lieu de redirect)
 */
export async function checkVendorAccessApi(vendorId: string): Promise<VendorAccessDecision | null> {
  const decision = await checkVendorAccess(vendorId)
  if (decision.status !== "allowed") return null
  return decision
}

/**
 * Messages d'erreur par statut pour l'affichage client
 */
export const VENDOR_ACCESS_MESSAGES: Record<VendorAccessStatus, string> = {
  allowed: "",
  unauthenticated: "Vous devez vous connecter pour accéder à cet espace.",
  not_vendor: "Cet espace est réservé aux vendeurs.",
  subscription_none: "Aucun abonnement actif. Veuillez souscrire pour accéder à votre espace vendeur.",
  subscription_pending: "Votre paiement est en cours de traitement. L'accès sera activé automatiquement après confirmation.",
  subscription_past_due: "Votre abonnement est en retard. Veuillez le renouveler pour accéder à votre espace vendeur.",
  subscription_expired: "Votre abonnement a expiré. Veuillez le renouveler pour accéder à votre espace vendeur.",
  subscription_cancelled: "Votre abonnement a été annulé. Veuillez souscrire à nouveau pour accéder à votre espace vendeur.",
  error: "Impossible de vérifier votre abonnement pour le moment. Veuillez réessayer.",
}

/**
 * Détermine la page de destination selon le statut
 */
export function getVendorAccessRedirect(status: VendorAccessStatus, defaultPath = "/dashboard/vendeur"): string {
  switch (status) {
    case "subscription_pending":
      return "/paiement/succes"
    case "subscription_none":
    case "subscription_past_due":
    case "subscription_expired":
    case "subscription_cancelled":
      return "/paiement/abonnement"
    case "unauthenticated":
      return "/connexion"
    case "not_vendor":
      return "/dashboard/client"
    case "error":
      return "/paiement/abonnement"
    default:
      return defaultPath
  }
}