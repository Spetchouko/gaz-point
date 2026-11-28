"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  ChevronRight,
  MapPin,
  Package,
  Plus,
  Power,
  Settings,
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
import { cn } from "@/lib/utils"

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

// NEW: Depot card for grid display in overview
function DepotGridCard({
  depot,
  isMain,
}: {
  depot: VendorDepotDto
  isMain?: boolean
}) {
  return (
    <div
      key={depot.id}
      className={cn(
        "p-3 rounded-lg border bg-card transition-all duration-200 hover:shadow-md",
        isMain ? "border-primary/30 bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-primary/30",
        !depot.isActive && "opacity-60 border-destructive/30 bg-destructive/5"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              depot.isActive ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}
          >
            <Store className="size-4" aria-hidden />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h4 className="font-semibold text-foreground truncate">{depot.name}</h4>
              {isMain && (
                <span className="rounded-full bg-primary/10 text-primary text-[10px] font-medium px-1.5 py-0.5">
                  Principal
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground truncate flex items-center gap-1">
              <MapPin className="size-3" aria-hidden />
              {depot.district}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <span className={cn("flex items-center gap-1 text-[10px] font-medium", depot.isActive ? "text-success" : "text-destructive")}>
            <Power className="size-2.5" aria-hidden />
            {depot.isActive ? "Actif" : "Inactif"}
          </span>
        </div>
      </div>
      <div className="mt-2 space-y-1.5 text-xs">
        <p className="text-muted-foreground line-clamp-1">{depot.address}</p>
        {depot.phone && (
          <p className="text-muted-foreground flex items-center gap-1">
            📞 {depot.phone}
          </p>
        )}
        <div className="flex flex-wrap gap-1">
          {depot.brands.slice(0, 3).map((brand) => (
            <span
              key={brand}
              className="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-medium"
            >
              {brand}
            </span>
          ))}
          {depot.brands.length > 3 && (
            <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px]">
              +{depot.brands.length - 3}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1">
          {depot.formats.slice(0, 3).map((format) => (
            <span
              key={format}
              className="rounded-full bg-secondary/10 text-secondary px-2 py-0.5 text-[10px] font-medium"
            >
              {format}
            </span>
          ))}
          {depot.formats.length > 3 && (
            <span className="rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-[10px]">
              +{depot.formats.length - 3}
            </span>
          )}
        </div>
      </div>
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
  const { depot, stats, activities, hasAnyData, loadErrors } = data
  const router = useRouter()
  const errorMessages = [error, ...(loadErrors ?? [])].filter(
    (message): message is string => Boolean(message)
  )

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
    {
      href: "/dashboard/vendeur/parametres",
      label: "Mes paramètres",
      description: "Configurer votre compte vendeur",
      icon: Settings,
    },
  ]

  return (
    <div className="space-y-4">
      {errorMessages.length > 0 && (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/5 p-4 shadow-sm"
          role="alert"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-destructive">
                Certaines données n&apos;ont pas pu être chargées
              </h2>
              <ul className="mt-1 space-y-0.5 text-sm text-destructive/80">
                {errorMessages.map((message, index) => (
                  <li key={`${message}-${index}`}>{message}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              Les données affichées peuvent être incomplètes.
            </p>
            <Button size="sm" variant="outline" onClick={() => router.refresh()}>
              Réessayer
            </Button>
          </div>
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
              <Link prefetch={false} href="/dashboard/depot/disponibilites">
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
              prefetch={false}
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
          {stats.depotCount > 0 && data.allDepots && data.allDepots.length > 0 ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {data.allDepots.map((d, idx) => (
                  <DepotGridCard key={d.id} depot={d} isMain={idx === 0} />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-primary/80">
                  Total : {stats.depotCount} dépôt{stats.depotCount !== 1 ? "s" : ""}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  render={<Link prefetch={false} href="/dashboard/depot/points">
                    <ChevronRight className="size-3.5 mr-1" aria-hidden />
                    Gérer tous les dépôts
                  </Link>}
                />
              </div>
            </>
          ) : (
            // No depot yet - show "Add depot" button
            <div className="text-center py-8">
              <Button
                size="lg"
                className="w-full"
                render={<Link prefetch={false} href="/dashboard/depot/points">
                  <Plus className="size-4 mr-2" aria-hidden />
                  Créer mon premier point de vente
                </Link>}
              />
            </div>
          )}
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
                  render={<Link prefetch={false} href="/dashboard/depot">Créer mon dépôt</Link>}
                />
                <Button
                  size="sm"
                  variant="outline"
                  render={
                    <Link prefetch={false} href="/dashboard/depot/disponibilites">
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