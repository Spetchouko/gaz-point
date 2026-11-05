"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  Calendar,
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
    <div className="min-h-screen bg-gray-50 py-6 sm:py-6">
      <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <header className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
              className="flex items-center gap-2 px-4 py-2.5"
              onClick={() => router.push("/dashboard")}
            >
              <Activity className="size-4" /> Trouver du gaz
            </Button>
            <Button variant="outline" className="flex items-center gap-2 px-4 py-2.5">
              <User className="size-4" /> Mon profil
            </Button>
          </div>
        </header>

        {/* Section 1 : Recherche de gaz (en premier) */}
        <section className="mb-6">
          <div className="mb-4">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight">
              Trouver du gaz
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Recherche par marque, format et zone pour trouver les points de
              vente disponibles en direct.
            </p>
          </div>
          <TrouverMonGaz />
        </section>

        {/* Section 2 : Statistiques du tableau de bord */}
        <section className="mb-6">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Mes réservations</p>
                    <p className="text-2xl font-bold tracking-tight text-primary">
                      {globalStats.totalReservations}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/50 text-primary border border-primary/100">
                    <Calendar className="size-5" />
                  </div>
                </div>
                <CardDescription className="mt-1 text-xs text-muted-foreground">
                  Réservations enregistrées
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Réservations actives</p>
                    <p className="text-2xl font-bold tracking-tight text-success">
                      {globalStats.activeReservations}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-success/50 text-success border border-success/100">
                    <Activity className="size-5" />
                  </div>
                </div>
                <CardDescription className="mt-1 text-xs text-muted-foreground">
                  En attente de retrait
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="hover:shadow-sm transition-shadow">
              <CardContent className="pt-4 pb-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Dépôts favoris</p>
                    <p className="text-2xl font-bold tracking-tight text-warning">
                      {globalStats.totalFavorites}
                    </p>
                  </div>
                  <div className="flex size-10 items-center justify-center rounded-xl bg-warning/50 text-warning border border-warning/100">
                    <User className="size-5" />
                  </div>
                </div>
                <CardDescription className="mt-1 text-xs text-muted-foreground">
                  Points de vente enregistrés
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Section 3 : Historique des activités / Réservations */}
        <section>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Historique de mes activités
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Consulte l'historique de tes réservations et leurs statuts.
              </p>
            </div>
          </div>
          <MesReservations />
        </section>
      </div>
    </div>
  )
}
