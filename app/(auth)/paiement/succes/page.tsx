"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { ArrowRight, CheckCircle2, Clock, RefreshCw, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ButtonSpinner, PageLoading, Spinner } from "@/app/_components/spinner"
import { requestJson } from "@/lib/client-request"

type PaymentStatus = "verifying" | "success" | "pending" | "error"

type PaymentDetails = {
  reference?: string
  amount?: number
  method?: string
}

function PaiementSuccesPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<PaymentStatus>("verifying")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState<PaymentDetails>({})

  const reference = searchParams.get("reference")?.trim() ?? ""

  const verifyPayment = useCallback(async () => {
    if (!reference) {
      setStatus("error")
      setMessage(
        "La référence du paiement est manquante. Impossible de confirmer la transaction."
      )
      return
    }

    setStatus("verifying")
    setMessage("Vérification du paiement en cours...")

    try {
      const data = await requestJson<{
        reference?: string
        status?: string
        amount?: number
        paymentMethod?: string
      }>(`/api/payment/verify/${encodeURIComponent(reference)}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })

      setDetails({
        reference: data.reference,
        amount: data.amount,
        method: data.paymentMethod,
      })

      if (data.status === "completed") {
        setStatus("success")
        setMessage("Paiement confirmé. Votre abonnement est activé.")
      } else if (data.status === "pending" || data.status === "processing") {
        setStatus("pending")
        setMessage(
          "Le paiement est en cours de traitement. L’activation sera automatique après sa confirmation."
        )
      } else {
        setStatus("error")
        setMessage(`Le paiement n’a pas abouti. Statut : ${data.status ?? "inconnu"}.`)
      }
    } catch (err) {
      console.error("[PaiementSucces] Verification error:", err)
      setStatus("error")
      setMessage(
        err instanceof Error
          ? err.message
          : "Erreur lors de la vérification du paiement."
      )
    }
  }, [reference])

  useEffect(() => {
    void verifyPayment()
  }, [verifyPayment])

  const handleGoToDashboard = () => {
    router.push("/dashboard/vendeur")
    router.refresh()
  }

  const handleRetry = () => {
    void verifyPayment()
  }

  const handleBackToPayment = () => {
    router.push("/paiement/abonnement")
  }

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="container mx-auto max-w-md">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 text-center">
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
                <CardTitle className="text-xl font-bold">Paiement confirmé</CardTitle>
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
                  <svg
                    className="size-7"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    aria-hidden
                  >
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
              <div className="space-y-2 rounded-lg bg-muted/50 p-4">
                <p className="text-sm font-medium">Détails de la transaction</p>
                <dl className="space-y-1 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Référence</dt>
                    <dd className="font-mono font-medium">{details.reference}</dd>
                  </div>
                  {details.amount !== undefined && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Montant</dt>
                      <dd className="font-medium">
                        {details.amount.toLocaleString("fr-FR")} FCFA
                      </dd>
                    </div>
                  )}
                  {details.method && (
                    <div className="flex justify-between gap-4">
                      <dt className="text-muted-foreground">Méthode</dt>
                      <dd className="font-medium capitalize">
                        {details.method.replace("_", " ")}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-3 rounded-lg border border-success/20 bg-success/5 p-4">
                <div className="flex items-start gap-3">
                  <Shield className="mt-0.5 size-5 shrink-0 text-success" />
                  <div>
                    <p className="font-medium text-success">Abonnement activé</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Votre tableau de bord vendeur est maintenant accessible.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === "pending" && (
              <div className="space-y-3 rounded-lg border border-warning/20 bg-warning/5 p-4">
                <div className="flex items-start gap-3">
                  <Clock className="mt-0.5 size-5 shrink-0 text-warning" />
                  <div>
                    <p className="font-medium text-warning">Traitement en cours</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Vous pouvez fermer cette page. L’activation de votre
                      abonnement se fera automatiquement après confirmation.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-3 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <p className="font-medium text-destructive">Action requise</p>
                <p className="text-sm text-muted-foreground">
                  Le paiement n’a pas pu être confirmé. Vérifiez à nouveau ou
                  recommencez le paiement.
                </p>
              </div>
            )}

            <div className="space-y-3 pt-2">
              {status === "success" && (
                <Button className="h-11 w-full text-lg" onClick={handleGoToDashboard}>
                  <ArrowRight className="mr-2 size-4" />
                  Accéder à mon espace vendeur
                </Button>
              )}

              {status === "pending" && (
                <Button
                  variant="outline"
                  className="h-11 w-full gap-2 text-lg"
                  onClick={handleRetry}
                >
                  <RefreshCw className="size-4" />
                  Vérifier à nouveau
                </Button>
              )}

              {status === "error" && (
                <>
                  {reference && (
                    <Button
                      variant="outline"
                      className="h-11 w-full gap-2 text-lg"
                      onClick={handleRetry}
                    >
                      <RefreshCw className="size-4" />
                      Vérifier à nouveau
                    </Button>
                  )}
                  <Button className="h-11 w-full text-lg" onClick={handleBackToPayment}>
                    Réessayer le paiement
                  </Button>
                  <Button
                    variant="outline"
                    className="h-11 w-full text-lg"
                    onClick={() => router.push("/contact")}
                  >
                    Contacter le support
                  </Button>
                </>
              )}

              {status === "verifying" && (
                <Button className="h-11 w-full text-lg" disabled>
                  <ButtonSpinner />
                  Vérification…
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Besoin d’aide ?{" "}
          <Link href="/contact" className="underline hover:text-foreground">
            Contactez-nous
          </Link>
        </p>
      </div>
    </main>
  )
}

export default function PaiementSuccesPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PaiementSuccesPageContent />
    </Suspense>
  )
}
