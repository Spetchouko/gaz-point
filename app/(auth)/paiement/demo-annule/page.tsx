"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { XCircle, ArrowLeft, CreditCard, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default function DemoPaymentCancelledPage() {
  const searchParams = useSearchParams()
  const ref = searchParams.get("ref")
  const isDemo = ref?.startsWith("DEMO-")

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-gray-200">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 size-16 rounded-full bg-gray-100 flex items-center justify-center">
            <XCircle className="size-8 text-gray-500" />
          </div>
          <CardTitle className="text-2xl text-gray-700">Paiement DEMO annulé</CardTitle>
          <CardDescription>
            Vous avez annulé le paiement de test. Votre abonnement n'a pas été activé.
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

          <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
            <div className="flex items-center gap-3">
              <CreditCard className="size-5 text-gray-500" />
              <div>
                <p className="font-medium text-gray-700">Abonnement en attente</p>
                <p className="text-sm text-gray-600">
                  Vous pouvez souscrire à tout moment pour accéder à votre espace vendeur.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Button
              size="lg"
              className="w-full"
              render={<Link prefetch={false} href="/dashboard/vendeur/abonnement">Souscrire maintenant</Link>}
            />
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              render={<Link prefetch={false} href="/dashboard/vendeur">Retour au tableau de bord</Link>}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}