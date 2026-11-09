"use client"

import { useEffect, useState } from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Loader2,
  CreditCard,
  Smartphone,
  Shield,
  AlertCircle,
  CheckCircle2,
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"

const PAYMENT_AMOUNT = 5000
const PAYMENT_CURRENCY = "FCFA"

function PaiementAbonnementPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [redirecting, setRedirecting] = useState(false)

  const vendorEmail = searchParams.get("email") ?? ""
  const redirectFrom = searchParams.get("redirect") ?? "/dashboard/vendeur"

  useEffect(() => {
    // Auto-initiate payment on page load
    initiatePayment()
  }, [])

  const initiatePayment = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch("/api/payment/initiate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}), // vendorId from session
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Erreur lors de l'initialisation du paiement")
      }

      if (data.checkoutUrl) {
        setRedirecting(true)
        // Redirect to GeniusPay checkout
        window.location.href = data.checkoutUrl
      } else {
        throw new Error("URL de paiement non reçue")
      }
    } catch (err) {
      console.error("[PaiementAbonnement] Error:", err)
      setError(err instanceof Error ? err.message : "Une erreur est survenue")
      setLoading(false)
    }
  }

  const handleRetry = () => {
    setError(null)
    initiatePayment()
  }

  const handleBack = () => {
    router.push("/inscription/vendeur")
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Loader2 className="size-8 text-primary animate-spin" />
            <p className="text-muted-foreground">Redirection vers GeniusPay...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="container mx-auto max-w-md">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            className="justify-start gap-1 text-muted-foreground hover:text-foreground"
            onClick={handleBack}
          >
            <svg
              className="size-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M19 12H5M12 19l-7-7 7-7" />
            </svg>
            Retour
          </Button>
        </div>

        <Card className="shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
              <CreditCard className="size-7" />
            </div>
            <CardTitle className="text-xl font-bold">
              Paiement de l'abonnement
            </CardTitle>
            <CardDescription>
              Souscrivez à l'abonnement vendeur pour accéder à votre tableau de
              bord
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Amount Summary */}
            <div className="rounded-lg bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">Montant à payer</p>
              <p className="mt-2 text-4xl font-bold tracking-tight">
                {PAYMENT_AMOUNT.toLocaleString()} <span className="text-lg font-normal">{PAYMENT_CURRENCY}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Par mois civil commencé
              </p>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                Moyens de paiement acceptés
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
                  <Smartphone className="size-4 text-success" />
                  <span>Orange Money</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
                  <Smartphone className="size-4 text-warning" />
                  <span>MTN Mobile Money</span>
                </div>
                <div className="flex items-center gap-2 rounded-lg border bg-card p-3 text-sm">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <span>Carte bancaire</span>
                </div>
              </div>
            </div>

            {/* Security Info */}
            <div className="flex items-start gap-3 rounded-lg bg-green-50 border border-green-200 p-4">
              <Shield className="size-5 text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-800">Paiement sécurisé</p>
                <p className="text-sm text-green-700 mt-1">
                  Vous serez redirigé vers la page de paiement sécurisée
                  GeniusPay. Aucune information bancaire n'est stockée sur
                  GazPoints.
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive flex items-center gap-2">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-3 pt-2">
              <Button
                className="w-full h-11 text-lg"
                onClick={handleRetry}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Initialisation…
                  </>
                ) : (
                  "Payer 5 000 FCFA"
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleBack}
                disabled={loading}
              >
                Annuler et revenir à l'inscription
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground">
              En payant, vous acceptez les{" "}
              <Link href="/cgv" className="underline hover:text-foreground">
                CGV
              </Link>
              . Facture envoyée par email après paiement.
            </p>
          </CardContent>
        </Card>

        {/* Info Cards */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <InfoCard
            icon={Shield}
            title="Sécurisé"
            description="Paiement via GeniusPay certifié"
          />
          <InfoCard
            icon={CheckCircle2}
            title="Activation immédiate"
            description="Accès instantané après paiement"
          />
          <InfoCard
            icon={Smartphone}
            title="Mobile Money"
            description="Orange Money & MTN MoMo Cameroun"
          />
        </div>
      </div>
    </div>
  )
}

export default function PaiementAbonnementPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
          <div className="animate-pulse">
            <Loader2 className="size-8 text-primary mx-auto" />
          </div>
        </div>
      }
    >
      <PaiementAbonnementPageContent />
    </Suspense>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}) {
  return (
    <Card className="text-center py-4">
      <CardContent className="flex flex-col items-center gap-2">
        <Icon className="size-5 text-primary" />
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
