"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity, User } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { TrouverMonGaz } from "@/app/_components/trouver-mon-gaz"
import { MesReservations } from "@/app/_components/mes-reservations"

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
    <div className="min-h-screen bg-background">
      {/* Bienvenue */}
      <header className="mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-foreground">
            Bienvenue {firstName} sur votre espace client.
          </h1>
          <p className="mt-2 text-base sm:text-lg text-muted-foreground leading-relaxed">
            Trouvez facilement votre bouteille de gaz et consultez les
            disponibilités près de chez vous.
          </p>
        </div>
      </header>

      {/* Raccourcis principaux */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight">
            Actions rapides
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre activité en quelques clics.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <Activity className="size-4" /> Trouver du gaz
          </Button>
        </div>
      </div>

      {/* Séparation visuelle */}
      <div className="mb-6 border-t border-border/50" />

      {/* Section : Recherche de gaz */}
      <section className="mb-6">
        <div className="mb-4 sm:mb-6">
          <h2 className="text-lg font-bold tracking-tight">
            Trouver du gaz
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Recherche par marque, format et zone pour trouver les points de
            vente disponibles en direct.
          </p>
        </div>
        <div className="rounded-xl border border-border bg-white p-4 sm:p-6 shadow-sm">
          <TrouverMonGaz />
        </div>
      </section>

      {/* Section : Statistiques du tableau de bord */}
      <section className="mb-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Mes réservations
                </p>
                <p className="text-2xl font-bold tracking-tight text-primary">
                  {globalStats.totalReservations}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/50 text-primary border border-primary/100">
                <Activity className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Réservations enregistrées
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Réservations actives
                </p>
                <p className="text-2xl font-bold tracking-tight text-success">
                  {globalStats.activeReservations}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/50 text-success border border-success/100">
                <Activity className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              En attente de retrait
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Dépôts favoris
                </p>
                <p className="text-2xl font-bold tracking-tight text-warning">
                  {globalStats.totalFavorites}
                </p>
              </div>
              <div className="flex size-10 items-center justify-center rounded-xl bg-warning/50 text-warning border border-warning/100">
                <User className="size-5" />
              </div>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Points de vente enregistrés
            </p>
          </div>
        </div>
      </section>

      {/* Section : Historique des activités / Réservations */}
      <section>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight">
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
  )
}
