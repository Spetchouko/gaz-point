"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
  Package,
  Heart,
  Activity,
  User,
} from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrouverMonGaz } from "@/app/_components/trouver-mon-gaz"
import { MesReservations } from "@/app/_components/mes-reservations"
import { cn } from "@/lib/utils"

type GlobalStats = {
  totalReservations: number
  activeReservations: number
  totalRecharges: number
  totalFavorites: number
}

export function DashboardClient({
  clientName,
  clientEmail,
  globalStats,
}: {
  clientName: string
  clientEmail: string | null | undefined
  globalStats: GlobalStats
}) {
  const router = useRouter()
  const { data: session } = authClient.useSession()

  useEffect(() => {
    if (session === null) {
      router.push("/connexion")
    }
  }, [session, router])

  if (!session?.user) {
    return null
  }

  const firstName = clientName.split(" ")[0]

  return (
    <div className="min-h-screen bg-gray-50 py-6 sm:py-8">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tableau de bord
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bonjour {firstName}, retrouve rapidement ta bouteille de gaz
              disponible près de chez toi.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="default"
              className="flex items-center gap-2"
              onClick={() => router.push("/dashboard")}
            >
              <Activity className="size-4" /> Trouver du gaz
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <User className="size-4" /> Mon profil
            </Button>
          </div>
        </header>

        {/* Cartes statistiques */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mes réservations</p>
                  <p className="text-2xl font-bold tracking-tight text-primary">
                    {globalStats.totalReservations}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/50 text-primary border border-primary/100">
                  <Calendar className="size-5" />
                </div>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                Réservations enregistrées
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Réservations actives</p>
                  <p className="text-2xl font-bold tracking-tight text-success">
                    {globalStats.activeReservations}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-success/50 text-success border border-success/100">
                  <Activity className="size-5" />
                </div>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                En attente de retrait
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Mes consignations</p>
                  <p className="text-2xl font-bold tracking-tight text-info">
                    {globalStats.totalRecharges}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-info/50 text-info border border-info/100">
                  <Package className="size-5" />
                </div>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                Recharges d'achat de gaz
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dépôts favoris</p>
                  <p className="text-2xl font-bold tracking-tight text-warning">
                    {globalStats.totalFavorites}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-warning/50 text-warning border border-warning/100">
                  <Heart className="size-5" />
                </div>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                Points de vente enregistrés
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Section Recherche de gaz — mise en avant */}
        <section className="mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-bold tracking-tight">
              Trouver du gaz
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Recherche par marque, format et zone pour trouver les points de
              vente disponibles en direct.
            </p>
          </div>
          <TrouverMonGaz />
        </section>

        {/* Section Mes réservations */}
        <section>
          <h2 className="text-xl font-bold tracking-tight mb-4">
            Mes réservations
          </h2>
          <p className="mt-1 text-sm text-muted-foreground mb-6">
            Consulte l'historique de tes réservations et leurs statuts.
          </p>
          <MesReservations />
        </section>
      </div>
    </div>
  )
}
