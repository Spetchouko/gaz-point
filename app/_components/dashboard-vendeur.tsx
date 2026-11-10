"use client"

import { useCallback, useMemo, useState } from "react"
import {
  Plus,
  Store,
  RefreshCw,
  Cylinder,
  Shield,
  CheckCircle2,
  AlertCircle,
  Activity,
  User,
  Truck,
  RotateCcw,
  Package,
  Pencil,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DisponibiliteForm } from "@/app/_components/disponibilite-form"
import { TrouverMonGaz } from "@/app/_components/trouver-mon-gaz"
import { cn } from "@/lib/utils"
import type { AvailabilityStatus } from "@/db/schema"
import {
  createPointDeVenteVendor,
  togglePointDeVente,
  deletePointDeVenteVendor,
  type ActionResult,
} from "@/app/dashboard/pro/actions"
import { useRouter } from "next/navigation"
import { PointDeVenteCard } from "@/app/_components/cards"
import { VendorPointOnboardingModal } from "@/app/_components/vendor-point-onboarding-modal"
import { usePathname } from "next/navigation"
import type { VendorInventoryEntry } from "@/lib/vendor-onboarding"

type VendorOnboardingInitial = {
  pointName: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  inventory: VendorInventoryEntry[]
}

type DispoRow = {
  id: string
  format: string | null
  status: string
  phone: string | null
  quantity: number | null
  note: string | null
  createdAt: string | Date
}

type PointWithStats = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  disponibilites: DispoRow[]
  latestDispo: DispoRow | null
  effectiveStatus: AvailabilityStatus | null
  isAvailable: boolean
  totalQuantity: number
  lastUpdate: string | Date | null
  hasPointBottles: boolean
  pointBottles: Array<{ brand: string; format: string; quantity?: number }>
}

type GlobalStats = {
  totalPoints: number
  totalDispos: number
  totalQuantity: number
  availablePoints: number
  lastUpdate: Date | null
  totalReservations: number
  pendingReservations: number
  hasPointDeVente: boolean
  hasBottles: boolean
  hasDisponibilites: boolean
}

type PathwayStep = {
  step: number
  label: string
  completed: boolean
  href: string
}

export function DashboardVendeur({
  vendorName,
  points,
  globalStats,
  pathwayStatus,
  bottlesByPoint,
  needsOnboarding,
  canEditOnboarding,
  onboardingInitial,
}: {
  vendorName: string
  points: PointWithStats[]
  globalStats: GlobalStats
  pathwayStatus: PathwayStep[]
  bottlesByPoint: Record<string, Array<{ brand: string; format: string; quantity?: number }>>
  needsOnboarding: boolean
  canEditOnboarding: boolean
  onboardingInitial: VendorOnboardingInitial
}) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false)
  const [editingDispo, setEditingDispo] = useState<{
    dispo: PointWithStats["disponibilites"][0]
    pointId: string
    pointName: string
  } | null>(null)

  const [pointAction, setPointAction] = useState<ActionResult | null>(null)
  const [pointPending, setPointPending] = useState(false)

  const pointMap = useMemo(
    () => new Map(points.map((p) => [p.id, p])),
    [points],
  )

  // Display the pathway indicator
  return (
    <div className="space-y-4">
      {/* En-tête du dashboard */}
      <header className="border-b border-border/20 pb-3">
        <div className="flex flex-col gap-2 sm:gap-3 w-full">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight">
            Bienvenue dans votre espace professionnel !
          </h1>
          <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
            Gérez votre point de vente et informez les clients de vos
            disponibilités en gaz.
          </p>
        </div>
      </header>

      {/* Finalisation du point de vente (parcours vendeur) */}
      {needsOnboarding && (
        <section className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
                <Store className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold leading-relaxed">
                  Finalisez la création de votre point de vente pour commencer à
                  gérer vos bouteilles.
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Vos informations saisies sont conservées : vous pouvez
                  reprendre à tout moment.
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="shrink-0"
            >
              <CheckCircle2 className="size-4" /> Compléter mon point de vente
            </Button>
          </div>
        </section>
      )}

      {/* Chemin de progression */}
      <div className="mb-4 border-b border-border/20 pb-3">
        <div className="flex items-center gap-2">
          {pathwayStatus.map((step) => (
            <div
              key={step.step}
              className={cn(
                "flex items-center gap-2 px-3 py-1 rounded-full text-xs",
                step.completed ? "bg-success/20 text-success border-success/20" : "bg-muted/20 text-muted-foreground border-muted/20"
              )}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-primary">
                {!step.completed && <Shield className="size-3.5" />}
              </span>
              {step.label}
            </div>
          ))}
        </div>
      </div>

      {/* Raccourcis principaux */}
      <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight">
            Actions rapides
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gérez votre activité en quelques clics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <Activity className="size-4" /> Trouver du gaz
          </Button>
          {canEditOnboarding && !needsOnboarding && (
            <Button
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => setIsOnboardingOpen(true)}
            >
              <Pencil className="size-4" /> Modifier mon point de vente
            </Button>
          )}
        </div>
      </div>

      {/* Section : Points de vente */}
      <section className="mb-4">
        <div className="mb-3 sm:mb-4">
          <h2 className="text-base font-bold tracking-tight">
            Mes points de vente
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Consultez vos points de vente enregistrés et gérez vos disponibilités.
          </p>
        </div>

        <div className="rounded-xl border border-background bg-white p-3 sm:p-4 shadow-sm">
          {/* Message quand aucun point de vente */}
          {points.length === 0 ? (
            <div className="min-h-[240px] flex flex-col items-center justify-center py-8">
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <Store className="size-5" />
              </span>
              <p className="font-medium">Aucun point de vente pour l'instant</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Ajoutez votre premier point de vente pour commencer à gérer vos
                disponibilités de gaz.
              </p>
              <Button
                onClick={() =>
                  needsOnboarding
                    ? setIsOnboardingOpen(true)
                    : router.push("/dashboard/vendeur/points-de-vente")
                }
                className="mt-4 mt-auto"
                variant="default"
              >
                <Plus className="size-4" />
                {needsOnboarding
                  ? "Compléter mon point de vente"
                  : "Ajouter un point de vente"}
              </Button>
            </div>
          ) : (
            /* Points de vente existants */
            <div className="space-y-3">
              {points.map((point) => (
                <PointDeVenteCard
                  key={point.id}
                  id={point.id}
                  name={point.name}
                  district={point.district}
                  address={point.address}
                  phone={point.phone}
                  disposCount={point.disponibilites.length}
                  status={point.effectiveStatus}
                  isActive={point.isAvailable}
                  onManageDispos={() => {
                    setEditingDispo({
                      dispo: {
                        id: "",
                        format: null,
                        status: "disponible",
                        phone: null,
                        quantity: null,
                        note: null,
                        createdAt: new Date().toISOString(),
                      },
                      pointId: point.id,
                      pointName: point.name,
                    })
                    setIsFormOpen(true)
                  }}
                  onDelete={() => handleDeletePoint(point.id)}
                  variant="vendor"
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Section : Statistiques du tableau de bord */}
      <section className="mb-4">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <div className="bg-white rounded-xl border border-border p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Points de vente
                </p>
                <p className="text-xl font-bold tracking-tight text-primary">
                  {globalStats.totalPoints}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/50 text-primary border border-primary/100">
                <Store className="size-4" />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Enregistrés
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Disponibilités
                </p>
                <p className="text-xl font-bold tracking-tight text-success">
                  {globalStats.totalDispos}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-success/50 text-success border border-success/100">
                <Activity className="size-4" />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Actives
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Réservations
                </p>
                <p className="text-xl font-bold tracking-tight text-warning">
                  {globalStats.totalReservations}
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-warning/50 text-warning border border-warning/100">
                <Shield className="size-4" />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Reçues
            </p>
          </div>

          <div className="bg-white rounded-xl border border-border p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Stock total
                </p>
                <p className="text-xl font-bold tracking-tight">
                  {globalStats.totalQuantity} bouteille(s)
                </p>
              </div>
              <div className="flex size-9 items-center justify-center rounded-xl bg-primary/50 text-primary border border-primary/100">
                <Cylinder className="size-4" />
              </div>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              En stock
            </p>
          </div>
        </div>
      </section>

      {/* Section : Chemin de configuration */}
      <section className="mb-4">
        <div className="space-y-3">
          {pathwayStatus.map((step) => (
            <div
              key={step.step}
              className="p-3 rounded-lg border border-border bg-white shadow-sm hover:shadow-lg transition-shadow"
              style={{ background: step.completed ? "bg-success/10" : "bg-white" }}
            >
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {step.label}{step.completed ? " : terminé" : step.completed ? "" : ` : ${step.href ? `voir ${step.href}` : "à compléter"}`}
                </span>
              </div>
              {step.completed || !step.completed ? (
                step.completed ? (
                  <span className="text-success text-xs mt-1">✓ Toutes les étapes obligatoires sont terminées</span>
                ) : (
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => router.push(step.href)}
                    className="text-primary hover:text-primary-dark mt-1"
                  >
                    {step.href ? "Continuer" : "Terminer"}
                  </Button>
                )
              ) : (
                <span className="text-warning text-xs mt-1">En cours...</span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Section : Navigation du dashboard */}
      <section className="mb-4">
        <div className="space-y-3">
          {/* Navigation items - using buttons for each section */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Tableau de bord"
              onClick={() => router.push("/dashboard/vendeur")}
              className="flex-1"
            >
              <Activity className="size-4" />
              <span className="sr-only">Tableau de bord</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Mon point de vente"
              onClick={() => router.push("/dashboard/vendeur/points-de-vente")}
              className="flex-1"
            >
              <Store className="size-4" />
              <span className="sr-only">Mon point de vente</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Mes bouteilles"
              onClick={() => router.push("/dashboard/vendeur/mes-bouteilles")}
              className="flex-1"
            >
              <Package className="size-4" />
              <span className="sr-only">Mes bouteilles</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Mes disponibilités"
              onClick={() => router.push("/dashboard/vendeur/disponibilites")}
              className="flex-1"
            >
              <Truck className="size-4" />
              <span className="sr-only">Mes disponibilités</span>
            </Button>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              size="icon"
              aria-label="Mes services"
              onClick={() => router.push("/dashboard/vendeur/mes-services")}
              className="flex-1"
            >
              <RotateCcw className="size-4" />
              <span className="sr-only">Mes services</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Mes réservations"
              onClick={() => router.push("/dashboard/vendeur/reservations")}
              className="flex-1"
            >
              <Shield className="size-4" />
              <span className="sr-only">Mes réservations</span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              aria-label="Mon profil"
              onClick={() => router.push("/dashboard/vendeur/profil")}
              className="flex-1"
            >
              <User className="size-4" />
              <span className="sr-only">Mon profil</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Modale de finalisation du point de vente */}
      <VendorPointOnboardingModal
        open={isOnboardingOpen}
        onOpenChange={setIsOnboardingOpen}
        vendorName={vendorName}
        initial={onboardingInitial}
      />
    </div>
  )
}

async function handleDeletePoint(pointId: string) {
  if (window.confirm("Êtes-vous sûr de vouloir supprimer ce point de vente ?")) {
    const formData = new FormData()
    formData.set("pointId", pointId)
    await deletePointDeVenteVendor(null, formData)
  }
}