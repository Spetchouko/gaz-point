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
  totalReservations: number
  pendingReservations: number
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
    try {
      const formData = new FormData()
      formData.set("name", values.name)
      formData.set("district", values.district)
      formData.set("address", values.address)
      if (values.phone) formData.set("phone", values.phone)
      const result = await createPointDeVenteVendor(null, formData)
      setPointAction(result)
    } finally {
      setPointPending(false)
    }
  }

  const handleTogglePoint = async (pointId: string) => {
    setPointPending(true)
    try {
      const formData = new FormData()
      formData.set("pointId", pointId)
      formData.set("isActive", "true")
      const result = await togglePointDeVente(null, formData)
      setPointAction(result)
    } finally {
      setPointPending(false)
    }
  }

  const handleDeletePoint = async (pointId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce point de vente ?")) {
      const formData = new FormData()
      formData.set("pointId", pointId)
      const result = await deletePointDeVenteVendor(null, formData)
      setPointAction(result)
    }
  }

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
        <div className="flex gap-2">
          <Button
            variant="default"
            className="flex items-center gap-2"
            onClick={() => router.push("/dashboard")}
          >
            <Activity className="size-4" /> Trouver du gaz
          </Button>
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

        <div className="rounded-xl border border-border bg-white p-3 sm:p-4 shadow-sm">
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
                onClick={() => setIsFormOpen(true)}
                className="mt-4 mt-auto"
                variant="default"
              >
                <Plus className="size-4" /> Ajouter un point de vente
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

          {/* Formulaire pour créer un nouveau point de vente */}
          {isFormOpen && (
            <div className="mt-6 max-w-md">
              <Card className="p-4">
                <CardHeader>
                  <CardTitle>Nouveau point de vente</CardTitle>
                </CardHeader>
                <CardContent>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault()
                      const formData = new FormData(e.currentTarget)
                      handleCreatePoint({
                        name: String(formData.get("name") ?? "").trim(),
                        district: String(formData.get("district") ?? "").trim(),
                        address: String(formData.get("address") ?? "").trim(),
                        phone: (String(formData.get("phone") ?? "").trim()) || null,
                      })
                    }}
                    className="grid gap-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Nom du point de vente
                        </label>
                        <input
                          type="text"
                          name="name"
                          required
                          placeholder="Ex: Dépôt Akwa"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Quartier
                        </label>
                        <input
                          type="text"
                          name="district"
                          required
                          placeholder="Ex: Akwa"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Adresse complète
                        </label>
                        <input
                          type="text"
                          name="address"
                          required
                          placeholder="Ex: Rue de la Paix, 123"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-muted-foreground">
                          Téléphone (optionnel)
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          placeholder="Ex: +237 6 99 00 00 00"
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        onClick={() => setIsFormOpen(false)}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        className="ml-auto"
                        disabled={pointPending}
                      >
                        {pointPending ? (
                          <>
                            <Store className="size-4 mr-2 animate-spin" />
                            Création en cours…
                          </>
                        ) : (
                          "Créer"
                        )}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
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
    </div>
  )
}