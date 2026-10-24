"use client"

import { useState } from "react"
import { Plus, Store, RefreshCw, Cylinder, MapPin, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardNav } from "@/app/_components/dashboard-nav"
import { DisponibiliteForm } from "@/app/_components/disponibilite-form"
import { DisponibiliteList } from "@/app/_components/disponibilite-list"
import { VerifierReservation } from "@/app/_components/verifier-reservation"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"
import { formatDate } from "@/lib/gaz"
import type { AvailabilityStatus } from "@/db/schema"

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
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDispo, setEditingDispo] = useState<{
    dispo: PointWithStats["disponibilites"][0]
    pointId: string
    pointName: string
  } | null>(null)

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

  // Collecter toutes les disponibilités de tous les points
  const allDispos = points.flatMap((point) =>
    point.disponibilites.map((dispo) => ({
      ...dispo,
      pointId: point.id,
      pointName: point.name,
    }))
  )

  if (points.length === 0) {
    return (
      <div className="min-h-screen bg-background py-6 sm:py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <DashboardNav pro={true} isVendor={true} />
          <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Espace vendeur</h1>
              <p className="mt-2 text-muted-foreground">
                Gère les disponibilités de gaz de tes dépôts
              </p>
            </div>
            <Badge variant="secondary">Vendeur</Badge>
          </header>
          <Card className="max-w-2xl mx-auto">
            <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
              <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
                <Store className="size-6 text-primary" aria-hidden />
              </span>
              <p className="font-medium">Aucun dépôt rattaché à ton compte</p>
              <p className="max-w-md text-sm text-muted-foreground">
                Contacte l&apos;administration (petchouko@gmail.com) pour faire
                rattacher ton dépôt, puis tu pourras y signaler la disponibilité
                du gaz.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background py-6 sm:py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <DashboardNav pro={true} isVendor={true} />
        <header className="mb-6 sm:mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight break-words">Espace vendeur</h1>
            <p className="mt-2 text-sm sm:text-base text-muted-foreground">
              Bonjour {vendorName.split(" ")[0]}, gère tes disponibilités
            </p>
          </div>
          <Badge variant="secondary">Vendeur</Badge>
        </header>

        {/* Statistiques globales */}
        <div className="mb-6 grid gap-4 grid-cols-2 sm:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dépôts rattachés</p>
                  <p className="text-3xl font-bold">{globalStats.totalPoints}</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Store className="size-6" />
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Bouteilles totales</p>
                  <p className="text-3xl font-bold">{globalStats.totalQuantity}</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <Cylinder className="size-6" />
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dépôts avec stock</p>
                  <p className="text-3xl font-bold text-success">{globalStats.availablePoints}</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <TrendingUp className="size-6" />
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dernière mise à jour</p>
                  <p className="text-sm font-bold">
                    {globalStats.lastUpdate
                      ? formatDate(globalStats.lastUpdate)
                      : "—"}
                  </p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <RefreshCw className="size-6" />
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section Vérifier une réservation */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold tracking-tight mb-4">Vérifier une réservation</h2>
          <p className="text-muted-foreground mb-4">
            Saisissez le code présenté par le client pour vérifier sa validité et confirmer le retrait.
          </p>
          <VerifierReservation />
        </div>

        {/* Grille visuelle des disponibilités */}
        <div className="mt-8 space-y-6">
          {allDispos.length === 0 ? (
            <Card className="max-w-2xl mx-auto p-6 text-center">
              <CardContent className="flex flex-col items-center gap-4">
                <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Store className="size-6" />
                </span>
                <p className="font-medium">Aucune disponibilité pour l&apos;instant</p>
                <p className="text-sm text-muted-foreground">
                  Publiez votre première disponibilité depuis l&apos;espace Pro pour
                  montrer aux clients où trouver votre gaz.
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
                const point = points.find((p) => p.id === dispo.pointId)
                return (
                  <Card
                    key={dispo.id}
                    className="p-4 hover:bg-card transition-colors"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <span className="text-sm font-medium">{dispo.format ?? "—"}</span>
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
                              ? `${dispo.quantity} bouteille{dispo.quantity > 1 ? "s" : ""}`
                              : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Dépôt</p>
                          <p className="font-medium">{point?.name ?? "—"}</p>
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
                        onClick={() => handleEditDispo(dispo, dispo.pointId, point?.name ?? "—")}
                      >
                        Voir les détails
                      </Button>
                    </div>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Points de vente avec disponibilités */}
        <div className="space-y-6">
          {points.map((point) => (
            <Card key={point.id}>
              <CardHeader className="flex flex-wrap items-start justify-between gap-2 pb-3">
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
                {/* Disponibilité actuelle du point */}
                {point.latestDispo && (
                  <div className="mb-4 p-4 rounded-lg border bg-muted/30">
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <p className="text-sm font-medium">Disponibilité actuelle</p>
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
                        <p className="font-medium">{point.latestDispo.format ?? "—"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Quantité</p>
                        <p className="font-medium">
                          {point.latestDispo.quantity !== null
                            ? `${point.latestDispo.quantity} bouteille{point.latestDispo.quantity > 1 ? "s" : ""}`
                            : "—"}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Localisation</p>
                        <p className="font-medium">{point.address} — {point.district}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Mis à jour</p>
                        <p className="font-medium">{formatDate(point.lastUpdate!)}</p>
                      </div>
                      {point.latestDispo.note && (
                        <div className="sm:col-span-2">
                          <p className="text-muted-foreground">Indication</p>
                          <p className="font-medium">{point.latestDispo.note}</p>
                        </div>
                      )}
                      {point.latestDispo.phone && (
                        <div>
                          <p className="text-muted-foreground">Téléphone</p>
                          <p className="font-medium">{point.latestDispo.phone}</p>
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