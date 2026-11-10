"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Activity, User } from "lucide-react"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { TrouverMonGaz } from "@/app/_components/trouver-mon-gaz"
import { DashboardSection } from "@/app/_components/dashboard-section"
import { MesReservations } from "@/app/_components/mes-reservations"

type GlobalStats = {
  totalReservations: number
  activeReservations: number
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
      {/* En-tête de bienvenue */}
      <header className="border-b border-border bg-card p-4 mb-4">
        <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
          Bienvenue {firstName} sur votre espace client.
        </h1>
        <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
          Trouvez facilement votre bouteille de gaz et consultez les
          disponibilités près de chez vous.
        </p>
      </header>

      {/* Section : Recherche de gaz (juste sous le message de bienvenue) */}
      <section className="mb-4">
        <DashboardSection
          title="Rechercher du gaz"
          icon={Activity}
          count={undefined}
          className=""
        >
          <TrouverMonGaz />
        </DashboardSection>
      </section>

      {/* Section : Statistiques principales */}
      <section className="mb-4">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardSection
            title="Réservations totales"
            icon={Activity}
            count={globalStats.totalReservations}
            className="text-primary"
          >
            <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">
              Mes réservations
            </p>
          </DashboardSection>

          <DashboardSection
            title="Réservations actives"
            icon={Activity}
            count={globalStats.activeReservations}
            className="text-success"
          >
            <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">
              En attente de retrait
            </p>
          </DashboardSection>
        </div>
      </section>

      {/* Section : Historique des activités */}
      <section>
        <DashboardSection
          title="Historique de mes activités"
          icon={Activity}
          count={undefined}
          className=""
        >
          <MesReservations />
        </DashboardSection>
      </section>
    </div>
  )
}