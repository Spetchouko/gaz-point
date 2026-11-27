"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { XCircle, ArrowLeft, CreditCard, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Spinner } from "@/app/_components/spinner"

export default function DemoPaymentFailurePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ref = searchParams.get("ref")
  const [verified, setVerified] = useState<{ success: boolean; status: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!ref) {
      setLoading(false)
      return
    }

    async function verifyPayment() {
      try {
        const res = await fetch(`/api/payment/verify/${ref}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        const data = await res.json()
        setVerified({ success: res.ok, status: data.status || data.subscription?.status || "unknown" })
      } catch {
        setVerified({ success: false, status: "error" })
      } finally {
        setLoading(false)
      }
    }

    verifyPayment()
  }, [ref])

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification du paiement DEMO...</p>
        </div>
      </div>
    )
  }

  const isDemo = ref?.startsWith("DEMO-")

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-destructive/20">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 size-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <XCircle className="size-8 text-destructive" />
          </div>
          <CardTitle className="text-2xl text-destructive">Paiement DEMO échoué</CardTitle>
          <CardDescription>
            Votre paiement de test a échoué. Votre abonnement n'a pas été activé.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ref && (
            <div className="p-4 bg-muted/30 rounded-xl text-center">
              <p className="text-xs text-muted-foreground">Référence de transaction</p>
              <p className="font-mono text-sm text-foreground break-all">{ref}</p>
              {isDemo && (
                <Badge variant="outline" className="mt-2 text-xs">
                  Mode DEMO
                </Badge>
              )}
            </div>
          )}

          <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="size-5 text-destructive" />
              <div>
                <p className="font-medium text-destructive">Abonnement non activé</p>
                <p className="text-sm text-muted-foreground">
                  Vous devez effectuer un paiement réussi pour accéder à votre espace vendeur.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              render={<Link prefetch={false} href="/dashboard/vendeur/abonnement">Réessayer le paiement</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => window.location.reload()}
            >
              <RefreshCw className="size-4 mr-2" /> Actualiser la page
            </Button>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Besoin d'aide ? Contactez le support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}