"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  CreditCard,
  AlertCircle,
  Loader2,
  Shield,
  ArrowLeft,
  RefreshCw,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/app/_components/spinner"
import { toast } from "sonner"
import { VendorPageHeader, VendorSectionCard } from "@/app/_components/vendor/vendor-ui"
import { cn } from "@/lib/utils"

const SUBSCRIPTION_AMOUNT = 5000 // FCFA
const SUBSCRIPTION_CURRENCY = "XAF"

interface SubscriptionStatus {
  status: string
  isActive: boolean
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  lastPaymentAt: string | null
  lastPaymentReference: string | null
  amount: number
  currency: string
  cancelledAt: string | null
}

interface DemoPaymentResult {
  success: boolean
  reference: string
  status: "completed" | "failed" | "cancelled"
  message: string
}

export function VendorSubscriptionPage({
  vendorId,
  vendorEmail,
  vendorName,
}: {
  vendorId: string
  vendorEmail: string
  vendorName: string
}) {
  const router = useRouter()
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [paymentLoading, setPaymentLoading] = useState(false)
  const [demoMode, setDemoMode] = useState<string | null>(null) // 'success' | 'failed' | 'cancelled' | null
  const [paymentReference, setPaymentReference] = useState<string | null>(null)

  // Load subscription status
  useEffect(() => {
    let cancelled = false
    async function loadSubscription() {
      try {
        setLoading(true)
        const res = await fetch("/api/vendor/subscription", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger l'abonnement")
        const data = await res.json()
        if (!cancelled) {
          setSubscription(data)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Erreur lors du chargement de l'abonnement")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadSubscription()
    return () => { cancelled = true }
  }, [])

  // Format date
  const formatDate = (dateString: string | null, withTime = false) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    })
  }

  // Format amount
  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: SUBSCRIPTION_CURRENCY, minimumFractionDigits: 0 }).format(amount)
  }

  // Status label
  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active": return "Actif"
      case "inactive": return "Inactif"
      case "past_due": return "En retard"
      case "cancelled": return "Annulé"
      case "none": return "Aucun abonnement"
      default: return status
    }
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "inactive": return "secondary"
      case "past_due": return "destructive"
      case "cancelled": return "outline"
      case "none": return "secondary"
      default: return "outline"
    }
  }

  // Generate unique demo reference
  const generateDemoReference = () => {
    const timestamp = Date.now().toString(36).toUpperCase()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `DEMO-${timestamp}-${random}`
  }

  // Initiate real GeniusPay payment
  const initiatePayment = async () => {
    setPaymentLoading(true)

    try {
      // Call real payment initiation API
      const res = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erreur lors de l'initialisation du paiement")
      }

      if (data.checkoutUrl) {
        // Redirect to GeniusPay checkout page
        window.location.href = data.checkoutUrl
      } else {
        throw new Error("URL de paiement non reçue")
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erreur inattendue"
      toast.error(message)
      setPaymentLoading(false)
    }
  }

  const loadSubscription = async () => {
    try {
      const res = await fetch("/api/vendor/subscription", {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (res.ok) {
        const data = await res.json()
        setSubscription(data)
      }
    } catch {
      // Ignore refresh errors
    }
  }

  const isActive = subscription?.isActive === true
  const isPastDue = subscription?.status === "past_due"
  const hasSubscription = subscription && subscription.status !== "none"

  if (loading) {
    return (
      <div className="space-y-4">
        <VendorPageHeader title="Mon abonnement" description="Gérez votre abonnement vendeur GazPoints" />
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Mon abonnement vendeur"
        description="Abonnement mensuel pour accéder à votre espace vendeur GazPoints"
        actions={
          <Link href="/dashboard/vendeur">
            <Button variant="outline" size="sm">
              <ArrowLeft className="size-4 mr-2" /> Retour au tableau de bord
            </Button>
          </Link>
        }
      />

      {error && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-4 text-destructive" />
              <span className="text-sm text-destructive">{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Subscription Status */}
      <VendorSectionCard
        title="Statut de l'abonnement"
        description={isActive ? "Votre abonnement est actif. Vous avez accès à toutes les fonctionnalités vendeur." : "Souscrivez pour débloquer l'accès à votre espace vendeur."}
      >
        <div className="space-y-6">
          {/* Main Status Card */}
          <Card className={cn(
            "border-2 transition-colors",
            isActive ? "border-green-200 bg-green-50" :
            isPastDue ? "border-orange-200 bg-orange-50" :
            "border-gray-200"
          )}>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "size-16 rounded-2xl flex items-center justify-center",
                    isActive ? "bg-green-100 text-green-600" :
                    isPastDue ? "bg-orange-100 text-orange-600" :
                    "bg-gray-100 text-gray-600"
                  )}>
                    <CreditCard className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">
                      {isActive ? "Abonnement actif" : hasSubscription ? getStatusLabel(subscription!.status) : "Aucun abonnement actif"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {isActive && subscription?.currentPeriodEnd
                        ? `Valide jusqu'au ${formatDate(subscription.currentPeriodEnd)}`
                        : hasSubscription && subscription?.status === "past_due"
                        ? "Paiement en retard - Veuillez renouveler votre abonnement"
                        : "Souscrivez pour accéder à votre espace vendeur"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={getStatusVariant(subscription?.status || "none")} className="text-lg px-4 py-2">
                    {getStatusLabel(subscription?.status || "none")}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subscription Details */}
          {hasSubscription && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground">Montant mensuel</p>
                <p className="text-2xl font-bold font-mono text-foreground">{formatAmount(subscription!.amount)}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground">Début de période</p>
                <p className="text-sm font-medium text-foreground">{formatDate(subscription!.currentPeriodStart, true)}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground">Fin de période</p>
                <p className="text-sm font-medium text-foreground">{formatDate(subscription!.currentPeriodEnd, true)}</p>
              </div>
              <div className="p-4 bg-muted/30 rounded-xl">
                <p className="text-xs text-muted-foreground">Dernier paiement</p>
                <p className="text-sm font-medium text-foreground">
                  {subscription!.lastPaymentAt ? formatDate(subscription!.lastPaymentAt, true) : "—"}
                </p>
              </div>
            </div>
          )}

          {/* Payment Reference */}
          {subscription?.lastPaymentReference && (
            <div className="p-4 bg-muted/30 rounded-xl border">
              <p className="text-xs text-muted-foreground">Référence du dernier paiement</p>
              <p className="font-mono text-sm text-foreground break-all">{subscription.lastPaymentReference}</p>
            </div>
          )}
        </div>
      </VendorSectionCard>

      {/* Payment Info */}
      <Card className="border-success/30 bg-success/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-success mt-0.5 shrink-0" />
            <div className="flex-1">
              <h4 className="font-medium text-success">Paiement sécurisé GeniusPay</h4>
              <p className="text-sm text-success/80 mt-1">
                Les paiements sont traités par GeniusPay (certifié PCI-DSS).
                Moyens acceptés : MTN Mobile Money, Orange Money, Carte bancaire.
              </p>
              <p className="text-xs text-success/60 mt-2">
                Vous serez redirigé vers la page de paiement GeniusPay. Aucune information bancaire n'est stockée sur GazPoints.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Actions */}
      <VendorSectionCard
        title="Souscription"
        description="Paiement sécurisé via GeniusPay (MTN Mobile Money, Orange Money, Carte bancaire)"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl border border-primary/20">
            <div className="flex items-center gap-4">
              <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                <CreditCard className="size-6" />
              </div>
              <div>
                <h4 className="font-semibold text-foreground">Abonnement mensuel vendeur</h4>
                <p className="text-sm text-muted-foreground">Accès complet à l'espace vendeur GazPoints</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold font-mono text-primary">{formatAmount(SUBSCRIPTION_AMOUNT)}</p>
              <p className="text-xs text-muted-foreground">par mois</p>
            </div>
          </div>

          <Separator />

          <Button
            size="lg"
            className="w-full h-14 text-lg"
            onClick={initiatePayment}
            disabled={paymentLoading || isActive}
          >
            {paymentLoading ? (
              <>
                <Loader2 className="size-5 mr-2 animate-spin" />
                Redirection vers GeniusPay...
              </>
            ) : (
              <>
                <CreditCard className="size-5 mr-2" />
                Payer 5 000 FCFA avec GeniusPay
              </>
            )}
          </Button>

          {!hasSubscription && !isActive && (
            <p className="text-center text-sm text-muted-foreground">
              Aucun abonnement actif. Cliquez sur le bouton ci-dessus pour souscrire.
            </p>
          )}

          {isPastDue && (
            <p className="text-center text-sm text-orange-600">
              Votre abonnement est en retard. Effectuez un paiement pour le réactiver.
            </p>
          )}
        </div>
      </VendorSectionCard>

      {/* Payment Methods Info */}
      <VendorSectionCard
        title="Moyens de paiement acceptés"
        description="Via GeniusPay — paiement 100% sécurisé"
      >
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">MTN Mobile Money</h4>
                  <p className="text-sm text-muted-foreground">Paiement mobile MTN (Cameroun)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-amber-200 bg-amber-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                  <Smartphone className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Orange Money</h4>
                  <p className="text-sm text-muted-foreground">Paiement mobile Orange (Cameroun)</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="border-blue-200 bg-blue-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                  <CreditCard className="size-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Carte bancaire</h4>
                  <p className="text-sm text-muted-foreground">Visa, Mastercard, etc.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </VendorSectionCard>

      {/* Admin Exemption Notice */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Shield className="size-5 text-purple-600 mt-0.5 shrink-0" />
            <div>
              <h4 className="font-semibold text-purple-800">Exemption administrateur</h4>
              <p className="text-sm text-purple-700 mt-1">
                Un administrateur peut vous offrir un abonnement et définir sa durée depuis l'interface d'administration.
                Dans ce cas, aucun paiement n'est requis et votre abonnement sera activé manuellement.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Refresh Button */}
      <div className="text-center">
        <Button variant="outline" size="sm" onClick={loadSubscription} disabled={loading}>
          <RefreshCw className="size-4 mr-2" /> Actualiser le statut
        </Button>
      </div>
    </div>
  )
}