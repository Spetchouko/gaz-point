"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Loader2, CheckCircle2, Clock, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useSafeSession } from "@/lib/auth-session"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function VendorAbonnementPage() {
  const router = useRouter()
  const { data: session } = useSafeSession()
  const sessionUser = session?.user

  const [abonnement, setAbonnement] = useState({
    statut: "aucun",
    dateDebut: null,
    dateFin: null,
    paiements: [],
    message: "Aucun abonnement actif",
    couleur: "text-muted-foreground",
  })

  useEffect(() => {
    let cancelled = false
    async function loadAbonnement() {
      try {
        if (!sessionUser) return
        const res = await fetch("/api/vendor/subscription", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger l'abonnement")
        const data = await res.json()
        if (!cancelled) {
          setAbonnement({
            statut: data.statut || "aucun",
            dateDebut: data.dateDebut,
            dateFin: data.dateFin,
            paiements: data.paiements || [],
            message: data.message || "Aucun abonnement actif",
            couleur: data.couleur || "text-muted-foreground",
          })
        }
      } catch (err) {
        if (!cancelled) {
          setAbonnement({
            statut: "erreur",
            message: "Erreur lors du chargement de l'abonnement",
            couleur: "text-destructive",
          })
          toast.error("Impossible de charger l'abonnement")
        }
      } finally {
        if (!cancelled) setTimeout(() => {}, 100)
      }
    }
    loadAbonnement()
    return () => {
      cancelled = true
    }
  }, [sessionUser])

  return (
    <div className="max-w-2xl mx-auto py-12">
      <Card className="p-6">
        <CardHeader>
          <CardTitle>Infos d'abonnement</CardTitle>
          <CardDescription>Votre statut d'abonnement vendeur</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <dt className="text-sm text-muted-foreground">Statut</dt>
              <dd className="font-medium {abonnement.couleur}">
                {abonnement.statut}
              </dt>
            </div>
            <dt className="text-sm text-muted-foreground">Expiration</dt>
            <dd className="font-medium {abonnement.couleur}">
              {abonnement.dateFin
                ? new Intl.DateTimeFormat("fr-FR", {
                    timeZone: "Africa/Douala",
                    year: "numeric",
                    month: "2-digit",
                    day: "2-digit",
                  }).format(new Date(abonnement.dateFin))
                : "Non définie"}
            </dd>
          </dl>

          {abonnement.paiements && abonnement.paiements.length > 0 && (
            <div className="mt-4">
              <dt className="text-sm text-muted-foreground">Historique des paiements</dt>
              <dd className="text-xs text-muted-foreground">
                {abonnement.paiements.length} paiement(s) enregistré(s)
              </dd>
            </div>
          )}

          {/* Bouton de renouvellement si abonnement expirant ou terminé */}
          {abonnement.statut !== "actif" && (
            <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <p className="text-sm text-primary font-medium mb-2">
                Votre abonnement n'est plus actif
              </p>
              <Link href="/vendor/signup" className="text-primary hover:underline">
                <Button size="sm" variant="outline">
                  Renouveler l'abonnement
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}