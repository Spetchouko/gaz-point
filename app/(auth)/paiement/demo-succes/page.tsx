"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { CheckCircle2, ArrowLeft, CreditCard, Loader2 } from "lucide-react"
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

export default function DemoPaymentSuccessPage() {
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

  const isSuccess = verified?.success === true && verified?.status === "completed"
  const isDemo = ref?.startsWith("DEMO-")

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className={`mx-auto mb-4 size-16 rounded-full flex items-center justify-center ${isSuccess ? "bg-green-100 text-green-600" : "bg-orange-100 text-orange-600"}`}>
            {isSuccess ? (
              <CheckCircle2 className="size-8" />
            ) : (
              <Loader2 className="size-8 animate-spin" />
            )}
          </div>
          <CardTitle className="text-2xl">
            {isSuccess ? "Paiement DEMO réussi !" : "Vérification en cours..."}
          </CardTitle>
          <CardDescription>
            {isSuccess
              ? "Votre abonnement vendeur a été activé avec succès (mode démo)."
              : "Nous vérifions le statut de votre paiement DEMO. Cela peut prendre quelques instants."}
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

          {isSuccess && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <CreditCard className="size-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">Abonnement activé</p>
                  <p className="text-sm text-green-700">Accès complet à votre espace vendeur</p>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              size="lg"
              className="flex-1"
              render={<Link prefetch={false} href="/dashboard/vendeur">Accéder au tableau de bord</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              className="flex-1"
              render={<Link prefetch={false} href="/dashboard/vendeur/abonnement">Voir mon abonnement</Link>}
            />
          </div>

          {!isSuccess && (
            <p className="text-center text-sm text-muted-foreground">
              Si le paiement a été effectué, l'activation peut prendre quelques minutes.
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => window.location.reload()}>
                Actualiser
              </Button>
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}