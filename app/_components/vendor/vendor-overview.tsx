"use client"

import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Package,
  Plus,
  Store,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import type { VendorDepotDto, VendorOverviewData } from "@/lib/vendor-dashboard"
import {
  VendorEmptyState,
  VendorPageHeader,
  VendorSectionCard,
  VendorStatusBadge,
} from "@/app/_components/vendor/vendor-ui"

const RESERVATION_LABELS: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  collected: "Récupérée",
  terminee: "Terminée",
  cancelled: "Annulée",
  expired: "Expirée",
}

// Helper to format numbers with non-breaking space for thousands
function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ")
}

// NEW: Component showing summary of a single depot
function DepotSummaryCard({ depot }: { depot: VendorDepotDto }) {
  return (
    <div className="p-4 border rounded-lg bg-primary/5 text-primary/80 mb-3">
      <h4 className="font-semibold text-foreground truncate">{depot.name}</h4>
      <p className="text-xs text-primary/80 mb-1">{depot.district}</p>
      <div className="flex items-center gap-2 text-xs">
        <Store className="size-3" aria-hidden />
        {depot.isActive ? "Dispo" : "Indisponible"}
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="mt-2 w-full text-left"
        render={<Link href="/dashboard/depot">Voir les détails</Link>}
      />
    </div>
  )
}

// NEW: Brief card for listing multiple depots
function DepotBriefCard({ depot }: { depot: VendorDepotDto }) {
  return (
    <div
      key={depot.id}
      className="p-3 rounded-lg border border-border bg-card hover:bg-primary/5 hover:text-primary/80 transition-colors cursor-pointer"
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = "translateY(-2px)"
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLElement
        el.style.transform = ""
      }}
    >
      <div className="flex items-center gap-2">
        <Store className="size-3 text-primary" aria-hidden />
        <span className="font-medium text-foreground truncate">{depot.name}</span>
      </div>
      <p className="text-xs text-muted-foreground line-clamp-1">{depot.district}</p>
      {depot.phone && (
        <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
          📞 {depot.phone}
        </p>
      )}
      <Button
        size="icon"
        variant="ghost"
        className="p-1 rounded-lg mt-1"
        title="Gérer"
      >
        <ArrowRight className="size-3.5" aria-hidden />
      </Button>
    </div>
  )
}

export function VendorOverview({
  data,
  error,
}: {
  data: VendorOverviewData
  error?: string | null
}) {
  const { depot, stats, activities, hasAnyData } = data

  const quickActions = [
    {
      href: "/dashboard/depot",
      label: depot ? "Modifier mon dépôt" : "Créer mon dépôt",
      description: depot ? depot.name : "Renseigner votre point de vente",
      icon: Store,
    },
    {
      href: "/dashboard/depot/disponibilites",
      label: "Mes disponibilités",
      description: depot ? "Mettre à jour vos stocks" : "Disponible après création du dépôt",
      icon: Package,
    },
    {
      href: "/dashboard/depot/reservations",
      label: "Mes réservations",
      description: "Traiter et vérifier les retraits",
      icon: Calendar,
    },
  ]

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-destructive">
                Erreur lors du chargement du dashboard
              </h2>
              <p className="mt-0.5 text-sm text-destructive/80">{error}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Certaines fonctionnalités peuvent être indisponibles. Réessayez en
            actualisant la page.
          </p>
        </div>
      )}
      <VendorPageHeader
        title="Vue d'ensemble"
        description={
          depot
            ? `${depot.name} · ${depot.district}`
            : "Bienvenue dans votre espace vendeur GazPoints"
        }
        actions={
          <Button
            size="sm"
            render={
              <Link href="/dashboard/depot/disponibilites">
                <Plus className="size-4" aria-hidden />
                Ajouter une disponibilité
              </Link>
            }
          />
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          {
            label: "Points de vente",
            value: stats.depotCount,
            icon: Store,
            href: "/dashboard/depot",
          },
          {
            label: "Disponibilités actives",
            value: stats.activeAvailabilityCount,
            icon: Package,
            href: "/dashboard/depot/disponibilites",
          },
          {
            label: "Réservations reçues",
            value: stats.reservationCount,
            icon: Calendar,
            href: "/dashboard/depot/reservations",
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <Link
              key={stat.label}
              href={stat.href}
              className="group relative flex items-center justify-between overflow-hidden rounded-lg border border-border bg-card p-4 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-primary/40 active:translate-y-0 active:shadow-sm active:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 cursor-pointer"
              onMouseEnter={(e) => {
                const link = e.currentTarget as HTMLElement
                link.style.transform = "translateY(-2px) scale(1.02)"
              }}
              onMouseLeave={(e) => {
                const link = e.currentTarget as HTMLElement
                link.style.transform = ""
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute inset-0 origin-left scale-x-0 bg-primary/[0.08] transition-transform duration-300 ease-out group-hover:scale-x-100 group-active:scale-x-100"
              />
              <div className="relative z-10 min-w-0">
                <p className="text-xs font-medium text-muted-foreground transition-colors duration-300 group-hover:text-foreground/80 group-active:text-foreground/80">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {formatNumber(stat.value)}
                </p>
              </div>
              <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 hover:bg-primary/20 hover:text-primary-foreground hover:scale-105 group-active:bg-primary group-active:text-primary-foreground group-active:scale-105">
                <Icon className="size-4" aria-hidden />
              </span>
            </Link>
          )
        })}
      </div>

      {/* Section: Mes points de vente */}
      <div className="grid gap-4">
        <VendorSectionCard
          title="Mes points de vente"
          description="Vos dépôts associés à votre compte vendeur"
          className="lg:col-span-1"
          contentClassName="p-4"
        >
          {stats.depotCount > 0 ? (
            // Show summary of main depot + brief list of others
            <>
              <DepotSummaryCard depot={depot} />

              <div className="mt-3">
                <p className="text-xs font-medium text-primary">
                  Vos autres dépôts :
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {/* We only have access to 'depot' (main), show count info */}
                  <div className="p-2 rounded-lg border border-primary/20 bg-primary/5 text-primary/80 text-center">
                    {stats.depotCount - 1} autres dépots
                  </div>
                </div>
              </div>
            </>
          ) : (
            // No depot yet - show "Add depot" button
            <div className="text-center py-8">
              <Button
                size="lg"
                className="w-full"
                render={
                  <Link href="/dashboard/depot">
                    Créer mon premier point de vente
                  </Link>
                }
              />
            </div>
          )}

          {/* Count info at the bottom */}
          <p className="mt-2 text-xs text-primary/80">
            Total : {stats.depotCount} dépôt{stats.depotCount !== 1 ? "s" : ""}
          </p>
        </VendorSectionCard>
      </div>

      {/* Indicateurs résumés */}
      <VendorSectionCard
        title="Résumé activité"
        description="Vue rapide de l'activité de vos dépôts"
        className="lg:col-span-1 my-4"
        contentClassName="p-4"
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Dépôts actifs
            </span>
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {stats.depotCount}
            </span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Disponibilités actives
            </span>
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {formatNumber(stats.activeAvailabilityCount)}
            </span>
          </div>
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted-foreground">
              Réservations reçues
            </span>
            <span className="text-2xl font-semibold tabular-nums text-foreground">
              {formatNumber(stats.reservationCount)}
            </span>
          </div>
        </div>
      </VendorSectionCard>

      {!hasAnyData && (
        <VendorSectionCard
          title="Bienvenue chez GazPoints"
          description="Votre espace vendeur est prêt. Commencez par créer votre point devente."
        >
          <VendorEmptyState
            icon={Store}
            title="Aucune donnée pour le moment"
            description="Créez votre dépôt, puis publiez vos disponibilités pour recevoir vos premières réservations."
            actions={
              <>
                <Button
                  size="sm"
                  render={<Link href="/dashboard/depot">Créer mon dépôt</Link>}
                />
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link href="/dashboard/depot/disponibilites">
                      Voir mes disponibilités
                    </Link>
                  }
                />
              </>
            }
          />
        </VendorSectionCard>
      )}
    </div>
  )
}