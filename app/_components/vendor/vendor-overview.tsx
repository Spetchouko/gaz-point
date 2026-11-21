"use client"

import Link from "next/link"
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Package,
  Plus,
  Store,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatDateTime } from "@/lib/gaz"
import type { VendorOverviewData } from "@/lib/vendor-dashboard"
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
          },
          {
            label: "Disponibilités actives",
            value: stats.activeAvailabilityCount,
            icon: Package,
          },
          {
            label: "Réservations reçues",
            value: stats.reservationCount,
            icon: Calendar,
          },
        ].map((stat) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm"
            >
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {stat.label}
                </p>
                <p className="mt-1 text-2xl font-semibold tabular-nums text-foreground">
                  {stat.value}
                </p>
              </div>
              <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
          )
        })}
      </div>

      {!hasAnyData && (
        <VendorSectionCard
          title="Bienvenue chez GazPoints"
          description="Votre espace vendeur est prêt. Commencez par créer votre point de vente."
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

      <div className="grid gap-4 lg:grid-cols-3">
        <VendorSectionCard
          title="Accès rapides"
          description="Les rubriques les plus utilisées"
          className="lg:col-span-1"
          contentClassName="p-2"
        >
          <div className="divide-y divide-border/70">
            {quickActions.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className="group flex items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-muted/60"
                >
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {action.label}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {action.description}
                    </span>
                  </span>
                  <ArrowRight
                    className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </Link>
              )
            })}
          </div>
        </VendorSectionCard>

        <VendorSectionCard
          title="Dernières activités"
          description="Réservations et disponibilités récentes"
          className="lg:col-span-2"
          contentClassName="p-0"
        >
          {activities.length === 0 ? (
            <VendorEmptyState
              icon={TrendingUp}
              title="Aucune activité"
              description="Vos dernières réservations et mises à jour apparaîtront ici."
            />
          ) : (
            <ul className="divide-y divide-border/70">
              {activities.map((activity) => (
                <li
                  key={activity.id}
                  className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
                >
                  <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {activity.type === "reservation" ? (
                      <Calendar className="size-4" aria-hidden />
                    ) : (
                      <Package className="size-4" aria-hidden />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      {activity.status && (
                        <VendorStatusBadge
                          status={activity.status}
                          label={
                            activity.type === "reservation"
                              ? RESERVATION_LABELS[activity.status] ?? activity.status
                              : activity.status === "disponible"
                                ? "Disponible"
                                : "Indisponible"
                          }
                        />
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {activity.detail}
                    </p>
                  </div>
                  <time
                    dateTime={activity.at}
                    className="shrink-0 text-xs text-muted-foreground"
                  >
                    {formatDateTime(activity.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </VendorSectionCard>
      </div>
    </div>
  )
}
