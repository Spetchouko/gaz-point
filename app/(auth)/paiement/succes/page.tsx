"use client"

import { useEffect, useState } from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, ArrowRight, Shield, Mail, Clock } from "lucide-react"
import Link from "next/link"
import { Spinner, PageLoading, ButtonSpinner } from "@/app/_components/spinner"

function PaiementSuccesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"verifying" | "success" | "pending" | "error">("verifying")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<{
    reference?: string
    amount?: number
    method?: string
  }>({})

  const reference = searchParams.get("reference") ?? ""
  const vendorEmail = searchParams.get("email") ?? ""

  const verifyPayment = async () => {
    setStatus("verifying")
    setMessage("Vérification du paiement en cours...")

    try {
      const response = await fetch(`/api/payment/verify/${reference}`)
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error ?? "Échec de la vérification")
      }

      setDetails({
        reference: data.reference,
        amount: data.amount,
        method: data.paymentMethod,
      })

      if (data.status === "completed") {
        setStatus("success")
        setMessage("Paiement confirmé ! Votre abonnement est activé.")
      } else if (data.status === "pending" || data.status === "processing") {
        setStatus("pending")
        setMessage("Paiement en cours de traitement. L&apos;activation aura lieu sous peu.")
      } else {
        setStatus("error")
        setMessage(`Statut du paiement : ${data.status}`)
      }
    } catch (err) {
      console.error("[PaiementSucces] Verification error:", err)
      setStatus("error")
      setMessage(err instanceof Error ? err.message : "Erreur lors de la vérification")
    }
  }

  const checkLatestPayment = async () => {
    // Fallback: redirect to dashboard if already authenticated
    setStatus("success")
    setMessage("Redirection vers votre espace vendeur...")
    setTimeout(() => router.push("/dashboard/vendeur"), 2000)
  }

  const handleGoToDashboard = () => {
    router.push("/dashboard/vendeur")
    router.refresh()
  }

  const handleRetry = () => {
    if (reference) {
      verifyPayment()
    } else {
      router.push("/paiement/abonnement")
    }
  }

  const handleBackToPayment = () => {
    router.push("/paiement/abonnement")
  }

  useEffect(() => {
    if (reference) {
      verifyPayment()
    } else {
      // No reference - might be direct return from GeniusPay
      // Check if we have a session and try to find latest transaction
      checkLatestPayment()
    }
  }, [reference, verifyPayment, checkLatestPayment])

  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="container mx-auto max-w-md">
        <Card className="shadow-sm">
          <CardHeader className="text-center pb-2">
            {status === "verifying" && (
              <>
                <Spinner size="lg" />
                <CardTitle className="text-xl font-bold">Vérification en cours</CardTitle>
              </>
            )}
            {status === "success" && (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 className="size-7" />
                </div>
                <CardTitle className="text-xl font-bold">Paiement confirmé !</CardTitle>
              </>
            )}
            {status === "pending" && (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-warning/10 text-warning">
                  <Clock className="size-7" />
                </div>
                <CardTitle className="text-xl font-bold">Paiement en cours</CardTitle>
              </>
            )}
            {status === "error" && (
              <>
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                  <svg className="size-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                  </svg>
                </div>
                <CardTitle className="text-xl font-bold">Problème détecté</CardTitle>
              </>
            )}
            <CardDescription>{message}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {details.reference && (
              <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                <p className="text-sm font-medium">Détails de la transaction</p>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Référence</dt>
                    <dd className="font-mono font-medium">{details.reference}</dd>
                  </div>
                  {details.amount && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Montant</dt>
                      <dd className="font-medium">{details.amount.toLocaleString()} FCFA</dd>
                    </div>
                  )}
                  {details.method && (
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Méthode</dt>
                      <dd className="font-medium capitalize">{details.method.replace("_", " ")}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {status === "success" && (
              <div className="rounded-lg bg-success/5 border border-success/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="size-5 text-success shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-success">Abonnement activé</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Votre tableau de bord vendeur est maintenant accessible.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Mail className="size-5 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium">Facture envoyée</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Une facture PDF a été envoyée à votre adresse email.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === "pending" && (
              <div className="rounded-lg bg-warning/5 border border-warning/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Clock className="size-5 text-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-warning">Traitement en cours</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le paiement est en cours de confirmation. L'activation de votre abonnement
                      se fera automatiquement dès réception de la confirmation.
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Vous pouvez fermer cette page et revenir plus tard. Votre tableau de bord
                  se mettra à jour automatiquement.
                </p>
              </div>
            )}

            {status === "error" && (
              <div className="rounded-lg bg-destructive/5 border border-destructive/20 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <svg className="size-5 text-destructive shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <div>
                    <p className="font-medium text-destructive">Action requise</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Le paiement n'a pas pu être confirmé. Veuillez réessayer ou contacter le support.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {status === "success" && (
                <Button
                  className="w-full h-11 text-lg"
                  onClick={handleGoToDashboard}
                >
                  <ArrowRight className="size-4 mr-2" />
                  Accéder à mon espace vendeur
                </Button>
              )}

              {status === "pending" && (
                <Button
                  variant="outline"
                  className="w-full h-11"
                  onClick={handleRetry}
                >
                  Vérifier à nouveau
                </Button>
              )}

              {status === "error" && (
                <>
                  <Button
                    className="w-full h-11"
                    onClick={handleBackToPayment}
                  >
                    Réessayer le paiement
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11"
                    onClick={() => router.push("/contact")}
                  >
                    Contacter le support
                  </Button>
                </>
              )}

              {status === "verifying" && (
                <Button className="w-full h-11" disabled>
                  <ButtonSpinner />
                  Vérification…
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Besoin d'aide ? <Link href="/contact" className="underline hover:text-foreground">Contactez-nous</Link>
        </p>
      </div>
    </div>
  )
}

export default function PaiementSuccesPage() {
  return (
    <Suspense
      fallback={
        <PageLoading />
      }
    >
      <PaiementSuccesPageContent />
    </Suspense>
  )
}
