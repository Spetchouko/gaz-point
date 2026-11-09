"use client"

import { useEffect, useState } from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { XCircle, RefreshCw, AlertCircle, Shield, Mail, Smartphone, CreditCard } from "lucide-react"
import Link from "next/link"

type ErrorType = "failed" | "cancelled" | "expired" | "unknown"

interface ErrorInfo {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
}

const ERROR_MESSAGES: Record<ErrorType, ErrorInfo> = {
  failed: {
    title: "Paiement refusé",
    description: "Le paiement n'a pas pu être effectué. Vérifiez votre solde ou réessayez avec un autre moyen de paiement.",
    icon: XCircle,
    color: "text-destructive",
  },
  cancelled: {
    title: "Paiement annulé",
    description: "Vous avez annulé le paiement. Aucun montant n'a été débité.",
    icon: AlertCircle,
    color: "text-warning",
  },
  expired: {
    title: "Session expirée",
    description: "La session de paiement a expiré. Veuillez réessayer.",
    icon: XCircle,
    color: "text-destructive",
  },
  unknown: {
    title: "Erreur de paiement",
    description: "Une erreur est survenue lors du paiement. Veuillez réessayer.",
    icon: AlertCircle,
    color: "text-destructive",
  },
}

function PaiementEchecPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  const errorParam = searchParams.get("error") ?? "unknown"
  const reference = searchParams.get("reference") ?? ""

  // Derive errorType from errorParam during render
  const errorType: ErrorType = ERROR_MESSAGES[errorParam as ErrorType] ? (errorParam as ErrorType) : "unknown"
  const errorInfo = ERROR_MESSAGES[errorType]

  const handleRetry = async () => {
    setLoading(true)
    router.push("/paiement/abonnement")
  }

  const handleContact = () => {
    router.push("/contact")
  }

  const handleBack = () => {
    router.push("/inscription/vendeur")
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="container mx-auto max-w-md">
        <Card className="shadow-sm">
          <CardHeader className="text-center pb-2">
            <div className={`mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 ${errorInfo.color}`}>
              <errorInfo.icon className="size-7" />
            </div>
            <CardTitle className="text-xl font-bold">{errorInfo.title}</CardTitle>
            <CardDescription>{errorInfo.description}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {reference && (
              <div className="rounded-lg bg-muted/50 p-4 text-center">
                <p className="text-sm text-muted-foreground">Référence de la transaction</p>
                <p className="mt-1 font-mono font-medium text-sm">{reference}</p>
              </div>
            )}

            <div className="rounded-lg bg-muted/50 p-4 space-y-3">
              <p className="font-medium">Moyens de paiement disponibles</p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm">
                  <Smartphone className="size-4 text-success" />
                  <span>Orange Money</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm">
                  <Smartphone className="size-4 text-warning" />
                  <span>MTN Mobile Money</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <span>Carte bancaire</span>
                </div>
              </div>
            </div>

            <div className="rounded-lg bg-success/5 border border-success/20 p-4 space-y-2">
              <div className="flex items-start gap-3">
                <Shield className="size-5 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-success">Paiement sécurisé</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Aucune information bancaire n&apos;est stockée sur GazPoints.
                    Le paiement est traité par GeniusPay.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <Button
                className="w-full h-11 text-lg"
                onClick={handleRetry}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <svg className="size-4 mr-2 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                    </svg>
                    Redirection...
                  </>
                ) : (
                  <>
                    <RefreshCw className="size-4 mr-2" />
                    Réessayer le paiement
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                className="w-full h-11"
                onClick={handleContact}
                disabled={loading}
              >
                Contacter le support
              </Button>

              <Button
                variant="ghost"
                className="w-full h-11 text-muted-foreground hover:text-foreground"
                onClick={handleBack}
                disabled={loading}
              >
                Retour à l'inscription
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 grid gap-4 sm:grid-cols-3 text-center">
          <HelpCard icon={Shield} title="Sécurisé" description="GeniusPay certifié" />
          <HelpCard icon={Smartphone} title="Mobile Money" description="Orange & MTN Cameroun" />
          <HelpCard icon={Mail} title="Support" description="contact@gazpoints.com" />
        </div>
      </div>
    </div>
  )
}

export default function PaiementEchecPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12">
          <div className="animate-pulse">
            <svg className="size-8 text-primary mx-auto animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
              <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
            </svg>
          </div>
        </div>
      }
    >
      <PaiementEchecPageContent />
    </Suspense>
  )
}

function HelpCard({ icon: Icon, title, description }: { icon: React.ComponentType<{ className?: string }>; title: string; description: string }) {
  return (
    <Card className="py-4">
      <CardContent className="flex flex-col items-center gap-2">
        <Icon className="size-5 text-primary" />
        <p className="font-medium text-sm">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}
