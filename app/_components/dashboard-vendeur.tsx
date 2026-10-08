"use client"

import { useState } from "react"
import { Plus, Store, RefreshCw, Package, MapPin, Phone, TrendingUp } from "lucide-react"
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

  if (points.length === 0) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto max-w-4xl px-4">
          <DashboardNav pro={true} />
          <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Espace vendeur</h1>
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
                Contacte l'administration (petchouko@gmail.com) pour faire
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
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-4xl px-4">
        <DashboardNav pro={true} />
        <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Espace vendeur</h1>
            <p className="mt-2 text-muted-foreground">
              Bonjour {vendorName.split(" ")[0]}, gère tes disponibilités
            </p>
          </div>
          <Badge variant="secondary">Vendeur</Badge>
        </header>

        {/* Statistiques globales */}
        <div className="mb-6 grid gap-4 sm:grid-cols-4">
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
                <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                  <Package className="size-6" />
                </span>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Dépôts avec stock</p>
                  <p className="text-3xl font-bold text-emerald-600">{globalStats.availablePoints}</p>
                </div>
                <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
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

        {/* Points de vente avec disponibilités */}
        <div className="space-y-6">
          {points.map((point) => (
            <Card key={point.id}>
              <CardHeader className="flex flex-row items-start justify-between pb-3">
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