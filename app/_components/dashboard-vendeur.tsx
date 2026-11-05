"use client"

import { useCallback, useMemo, useState } from "react"
import {
  Plus,
  Store,
  RefreshCw,
  Cylinder,
  MapPin,
  TrendingUp,
  Activity,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DisponibiliteForm } from "@/app/_components/disponibilite-form"
import { DisponibiliteList } from "@/app/_components/disponibilite-list"
import { VerifierReservation } from "@/app/_components/verifier-reservation"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"
import { cn } from "@/lib/utils"
import { formatDate } from "@/lib/gaz"
import type { AvailabilityStatus } from "@/db/schema"
import {
  createPointDeVenteVendor,
  togglePointDeVente,
  deletePointDeVenteVendor,
  type ActionResult,
} from "@/app/dashboard/pro/actions"
import { useRouter } from "next/navigation"

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
}

type GlobalStats = {
  totalPoints: number
  totalDispos: number
  totalQuantity: number
  availablePoints: number
  lastUpdate: Date | null
}

export function DashboardVendeur({
  vendorName,
  points,
  globalStats,
}: {
  vendorName: string
  points: PointWithStats[]
  globalStats: GlobalStats
}) {
  const router = useRouter()
  const [isFormOpen, setIsFormOpen] = useState(false)
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

  const handleCreatePoint = async (values: {
    name: string
    district: string
    address: string
    phone: string | null
  }) => {
    setPointPending(true)
    setPointAction(null)
    const result = await createPointDeVenteVendor(null, {
      name: values.name,
      district: values.district,
      address: values.address,
      phone: values.phone,
    } as unknown as FormData)
    setPointAction(result)
    setPointPending(false)
    if (result.ok) {
      router.push("/dashboard/vendeur/points-de-vente")
    }
  }

  const handleTogglePoint = async (pointId: string, isActive: boolean) => {
    setPointPending(true)
    setPointAction(null)
    const result = await togglePointDeVente(null, {
      pointId,
    } as unknown as FormData)
    setPointAction(result)
    setPointPending(false)
    if (result.ok) {
      router.push("/dashboard/vendeur")
    }
  }

  const handleDeletePoint = async (pointId: string) => {
    setPointPending(true)
    setPointAction(null)
    const result = await deletePointDeVenteVendor(null, {
      pointId,
    } as unknown as FormData)
    setPointAction(result)
    setPointPending(false)
    if (result.ok) {
      router.push("/dashboard/vendeur")
    }
  }

  const handleAddDispo = (point?: PointWithStats) => {
    if (point) {
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
    }
    setIsFormOpen(true)
  }

  const handleEditDispo = (
    dispo: PointWithStats["disponibilites"][0],
    pointId: string,
    pointName: string
  ) => {
    setEditingDispo({ dispo, pointId, pointName })
    setIsFormOpen(true)
  }

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingDispo(null)
  }

  // Collecter toutes les disponibilités de tous les points — wrapped in useMemo
  const allDispos = useMemo(
    () =>
      points.flatMap((point) =>
        point.disponibilites.map((dispo) => ({
          ...dispo,
          pointId: point.id,
          pointName: point.name,
        }))
      ),
    [points],
  )

  const firstName = vendorName.split(" ")[0]

  if (points.length === 0) {
    return (
      <div className="min-h-screen bg-background py-6 sm:py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                Tableau de bord vendeur
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Bonjour {firstName}, voici ton espace de gestion
              </p>
            </div>
            <Badge variant="secondary">Vendeur</Badge>
          </header>

          <Card className="max-w-2xl mx-auto border-2 border-dashed border-primary/20 rounded-2xl bg-primary/5">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <span className="flex size-16 items-center justify-center rounded-full bg-primary/20 text-primary">
                <Store className="size-8" aria-hidden />
              </span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                Créez votre premier point de vente
              </h2>
              <p className="text-sm text-muted-foreground max-w-md">
                Enregistrez votre point de vente pour permettre aux clients de
                vous trouver et de consulter vos disponibilités en gaz.
              </p>
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  const formData = new FormData(e.currentTarget)
                  handleCreatePoint({
                    name: formData.get("name") as string,
                    district: formData.get("district") as string,
                    address: formData.get("address") as string,
                    phone: (formData.get("phone") as string) || null,
                  })
                }}
                className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:max-w-md"
              >
                <div className="flex-1 sm:w-auto space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Nom du point de vente
                  </label>
                  <input
                    name="name"
                    type="text"
                    required
                    placeholder="Ex: Dépôt Akwa"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div className="flex-1 sm:w-auto space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Quartier
                  </label>
                  <input
                    name="district"
                    type="text"
                    required
                    placeholder="Ex: Akwa"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div className="flex-1 sm:w-auto space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Adresse
                  </label>
                  <input
                    name="address"
                    type="text"
                    required
                    placeholder="Ex: Rue de la Paix, 123"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div className="flex-1 sm:w-auto space-y-2">
                  <label className="block text-xs font-medium text-muted-foreground">
                    Téléphone (facultatif)
                  </label>
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Ex: +237 6 99 00 00 00"
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <Button
                  type="submit"
                  variant="default"
                  size="lg"
                  disabled={pointPending}
                  className="whitespace-nowrap flex-1 sm:flex-none"
                >
                  {pointPending ? (
                    <>
                      <Store className="size-4 mr-2 animate-spin" /> Création en cours…
                    </>
                  ) : (
                    <>
                      <Plus className="size-4 mr-2" />
                      Créer mon point de vente
                    </>
                  )}
                </Button>
              </form>

              {pointAction && (
                <div
                  className={cn(
                    "flex items-center gap-2 px-4 py-3 rounded-lg text-sm",
                    pointAction.ok
                      ? "bg-success/10 border border-success/20 text-success"
                      : "bg-destructive/10 border border-destructive/20 text-destructive"
                  )}
                >
                  {pointAction.ok ? <CheckCircle2 className="size-4" /> : <AlertCircle className="size-4" />}
                  {pointAction.message}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-8">
      <div className="container mx-auto max-w-7xl px-4">
        {/* Header */}
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              Tableau de bord
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Bonjour {firstName}, gère tes disponibilités de gaz
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-xs px-2 py-1.5">
              Compte vendeur
            </Badge>
          </div>
        </header>

        {/* Cartes statistiques */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Dépôts rattachés
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {globalStats.totalPoints}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/50 text-primary border border-primary/100">
                  <Store className="size-5" />
                </div>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                Points de vente actifs
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Bouteilles disponibles
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-success">
                    {globalStats.totalQuantity}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-success/50 text-success border border-success/100">
                  <Cylinder className="size-5" />
                </div>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                Quantité totale en stock
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Dépôts avec stock
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-success">
                    {globalStats.availablePoints}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-success/50 text-success border border-success/100">
                  <CheckCircle2 className="size-5" />
                </div>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                Points actuellement approvisionnés
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="hover:shadow-sm transition-shadow">
            <CardContent className="pt-5 pb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Disponibilités publiées
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-primary">
                    {globalStats.totalDispos}
                  </p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/50 text-primary border border-primary/100">
                  <Activity className="size-5" />
                </div>
              </div>
              <CardDescription className="mt-2 text-xs text-muted-foreground">
                Annonces de disponibilité actives
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* Vérifier une réservation */}
        <div className="mb-8">
          <h2 className="text-lg font-bold tracking-tight mb-3">
            Vérifier une réservation
          </h2>
          <p className="text-sm text-muted-foreground mb-4">
            Saisissez le code présenté par le client pour vérifier sa validité
            et confirmer le retrait.
          </p>
          <VerifierReservation />
        </div>

        {/* Bouton principal + disponibilités récentes */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">
              Disponibilités récentes
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              État actuel de tes dépôts de gaz
            </p>
          </div>
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => handleAddDispo()}
          >
            <Plus className="size-4" />
            Ajouter une disponibilité
          </Button>
        </div>

        {allDispos.length === 0 ? (
          <Card className="max-w-2xl mx-auto p-8 text-center">
            <CardContent className="flex flex-col items-center gap-4">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Store className="size-6" />
              </span>
              <p className="font-medium">Aucune disponibilité pour l'instant</p>
              <p className="text-sm text-muted-foreground max-w-md">
                Publiez votre première disponibilité pour montrer aux clients où
                trouver votre gaz.
              </p>
              <Button
                variant="default"
                size="sm"
                onClick={() => handleAddDispo()}
              >
                <Plus className="size-4" /> Première disponibilité
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allDispos.map((dispo) => {
              const point = pointMap.get(dispo.pointId)
              return (
                <Card
                  key={dispo.id}
                  className="p-4 hover:bg-card transition-colors"
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <span className="text-sm font-medium">
                          {dispo.format ?? "—"}
                        </span>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${availabilityBadgeClass[dispo.status as AvailabilityStatus]} shrink-0`}
                      >
                        {availabilityLabel[dispo.status as AvailabilityStatus]}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="grid gap-2 text-sm">
                      <div>
                        <p className="text-muted-foreground">Quantité</p>
                        <p className="font-medium">
                          {dispo.quantity !== null
                            ? `${dispo.quantity} bouteille${
                                dispo.quantity > 1 ? "s" : ""
                              }`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Dépôt</p>
                        <p className="font-medium truncate">
                          {point?.name ?? "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mis à jour</p>
                        <p className="font-medium">
                          {formatDate(new Date(dispo.createdAt))}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                  <div className="pt-3 border-t border-muted/20">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-1 text-xs font-semibold"
                      onClick={() =>
                        handleEditDispo(dispo, dispo.pointId, point?.name ?? "—")
                      }
                    >
                      Voir les détails
                    </Button>
                  </div>
                </Card>
              )
            })}
          </div>
        )}

        {/* Points de vente */}
        <div className="mt-12">
          <h2 className="text-xl font-bold tracking-tight mb-6">
            Mes points de vente
          </h2>
          <div className="space-y-3">
            {points.map((point) => (
              <Card key={point.id} className="hover:shadow-sm transition-shadow">
                <CardHeader
                  className="flex flex-wrap items-start justify-between gap-2 pb-3"
                >
                  <div>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Store className="size-4 text-primary" aria-hidden />
                      {point.name}
                    </CardTitle>
                    <CardDescription className="mt-1 flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0" aria-hidden />
                      {point.address} — {point.district}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    {point.effectiveStatus && (
                      <Badge
                        variant="outline"
                        className={availabilityBadgeClass[point.effectiveStatus]}
                      >
                        {availabilityLabel[point.effectiveStatus]}
                      </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => handleAddDispo(point)}
                    >
                      <Plus className="size-4" />
                      Disponibilité
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  {point.latestDispo && (
                    <div className="mb-4 p-4 rounded-lg border bg-muted/30">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                        <p className="text-sm font-medium">
                          Disponibilité actuelle
                        </p>
                        <Badge
                          variant="outline"
                          className={availabilityBadgeClass[point.effectiveStatus!]}
                        >
                          {availabilityLabel[point.effectiveStatus!]}
                        </Badge>
                      </div>
                      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Type</p>
                          <p className="font-medium">
                            {point.latestDispo.format ?? "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Quantité</p>
                          <p className="font-medium">
                            {point.latestDispo.quantity !== null
                              ? `${point.latestDispo.quantity} bouteille${
                                  point.latestDispo.quantity > 1 ? "s" : ""
                                }`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Localisation</p>
                          <p className="font-medium truncate">
                            {point.address} — {point.district}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Mis à jour</p>
                          <p className="font-medium">
                            {formatDate(point.lastUpdate!)}
                          </p>
                        </div>
                        {point.latestDispo.note && (
                          <div className="sm:col-span-2">
                            <p className="text-muted-foreground">Indication</p>
                            <p className="font-medium">
                              {point.latestDispo.note}
                            </p>
                          </div>
                        )}
                        {point.latestDispo.phone && (
                          <div>
                            <p className="text-muted-foreground">Téléphone</p>
                            <p className="font-medium">
                              {point.latestDispo.phone}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <DisponibiliteList
                    point={point}
                    onEdit={handleEditDispo}
                    onAdd={() => handleAddDispo(point)}
                  />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <DisponibiliteForm
          key={`${isFormOpen ? "open" : "closed"}-${editingDispo?.dispo.id ?? "new"}`}
          open={isFormOpen}
          onClose={handleCloseForm}
          editingDispo={editingDispo}
          points={points.map((p) => ({
            id: p.id,
            name: p.name,
            district: p.district,
            address: p.address,
            phone: p.phone,
            disponibilites: p.disponibilites,
          }))}
        />
      </div>
    </div>
  )
}
