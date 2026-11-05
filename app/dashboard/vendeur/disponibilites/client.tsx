"use client"

import { useState } from "react"
import {
  Store,
  Plus,
  X,
  LogOut,
  MapPin,
  Edit,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type DispoRow = {
  id: string
  pointId: string
  status: string
  note: string | null
  quantity: number | null
  format: string | null
  brand: string | null
  createdAt: Date
}

type PointRow = {
  id: string
  name: string
  district: string
}

type DisponibilitesClientProps = {
  userName: string
  userEmail: string | null | undefined
  points: PointRow[]
  allDispos: DispoRow[]
  onSaveDispo: (values: {
    pointId: string
    pointName: string
    format: string | null
    status: string
    note: string | null
    quantity: number | null
    brand: string | null
  }) => Promise<void>
  onDeleteDispo: (dispoId: string) => Promise<void>
}

export function DisponibilitesClient({
  userName,
  userEmail,
  points,
  allDispos,
  onSaveDispo,
  onDeleteDispo,
}: DisponibilitesClientProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingDispo, setEditingDispo] = useState<{
    id: string
    pointId: string
    pointName: string
    format: string | null
    status: string
    note: string | null
    quantity: number | null
    brand: string | null
  } | null>(null)

  const disposByPoint = new Map<string, DispoRow[]>()
  allDispos.forEach((d) => {
    const existing = disposByPoint.get(d.pointId) ?? []
    existing.push(d)
    disposByPoint.set(d.pointId, existing)
  })

  const isEditMode = showAddForm && !!editingDispo
  const isAddMode = showAddForm && !editingDispo

  const handleSaveDispo = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    await onSaveDispo({
      pointId: formData.get("pointId") as string,
      pointName: formData.get("pointName") as string,
      format: (formData.get("format") as string) || null,
      status: formData.get("status") as string,
      note: (formData.get("note") as string) || null,
      quantity: Number(formData.get("quantity")) || null,
      brand: (formData.get("brand") as string) || null,
    })
    setShowAddForm(false)
    setEditingDispo(null)
    window.location.href = "/dashboard/vendeur/disponibilites"
  }

  const handleDeleteDispo = async (dispoId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette disponibilité ?")) {
      await onDeleteDispo(dispoId)
      window.location.href = "/dashboard/vendeur/disponibilites"
    }
  }

  function effectiveStatus(
    status: string,
    createdAt: Date | string
  ): "disponible" | "indisponible" | "a_confirmer" {
    return status as "disponible" | "indisponible" | "a_confirmer"
  }

  return (
    <div>
      <div className="pt-4 border-b border-muted/20">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            Disponibilités
          </h1>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Tableau de bord"
            onClick={() => {
              window.location.href = "/dashboard/vendeur"
            }}
          >
            <Store className="size-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Card className="p-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">Total points</p>
            <p className="text-2xl font-bold">{points.length}</p>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">Disponibilités</p>
            <p className="text-2xl font-bold">{allDispos.length}</p>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">Disponibles</p>
            <p className="text-2xl font-bold text-success">
              {allDispos.filter(
                (d) => d.status === "disponible" && d.quantity && d.quantity > 0
              ).length}
            </p>
          </CardContent>
        </Card>
        <Card className="p-4">
          <CardContent>
            <p className="text-sm text-muted-foreground">En édition</p>
            <p className="text-2xl font-bold text-primary">
              {editingDispo ? 1 : 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        {points.map((point) => {
          const pointDispos = disposByPoint.get(point.id) || []
          return (
            <Card key={point.id} className="hover:shadow-sm transition-shadow">
              <CardHeader className="flex flex-wrap items-start justify-between gap-2 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Store className="size-4 text-primary" aria-hidden />
                    {point.name}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1.5">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {point.district}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {pointDispos.length} disponibilités
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                {pointDispos.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <span className="flex size-6 items-center justify-center rounded-full bg-primary/10 text-primary mb-2">
                      <Plus className="size-4" />
                    </span>
                    <p>Aucune disponibilité pour le moment</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowAddForm(true)
                      }}
                    >
                      <Plus className="size-4" /> Ajouter
                    </Button>
                  </div>
                ) : (
                  <div className="p-4">
                    {pointDispos.map((dispo) => {
                      const effective = effectiveStatus(
                        dispo.status,
                        dispo.createdAt
                      )
                      return (
                        <div
                          key={dispo.id}
                          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3"
                        >
                          <div>
                            <p className="text-muted-foreground">Format</p>
                            <p className="font-medium">
                              {dispo.format ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Marque</p>
                            <p className="font-medium">
                              {dispo.brand ?? "—"}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Statut</p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0",
                                availabilityBadgeClass[
                                  effective as keyof typeof availabilityBadgeClass
                                ]
                              )}
                            >
                              {availabilityLabel[effective]}
                            </Badge>
                          </div>
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
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="pt-3 border-t border-muted/20 flex gap-2">
                  {pointDispos.map((dispo) => (
                    <Button
                      key={dispo.id}
                      variant="ghost"
                      size="sm"
                      className="flex-1"
                      onClick={() =>
                        setEditingDispo({
                          id: dispo.id,
                          pointId: dispo.pointId,
                          pointName: point.name,
                          format: dispo.format,
                          status: dispo.status,
                          note: dispo.note,
                          quantity: dispo.quantity,
                          brand: dispo.brand,
                        })
                      }
                    >
                      <Edit className="size-4" aria-hidden /> Voir détails
                    </Button>
                  ))}
                  {pointDispos.map((dispo) => (
                    <Button
                      key={`delete-${dispo.id}`}
                      variant="destructive"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleDeleteDispo(dispo.id)}
                    >
                      <LogOut className="size-4" /> Supprimer
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {isEditMode && editingDispo ? (
        <div className="mt-8 max-w-md">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Modifier la disponibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDispo}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Point de vente
                    </label>
                    <select
                      name="pointId"
                      value={editingDispo.pointId}
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      {points.map((point) => (
                        <option
                          key={point.id}
                          value={point.id}
                          selected={point.id === editingDispo.pointId}
                        >
                          {point.name} ({point.district})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Format de bouteille
                    </label>
                    <input
                      type="text"
                      name="format"
                      value={editingDispo.format ?? ""}
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Statut
                    </label>
                    <select
                      name="status"
                      value={editingDispo.status}
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="a_confirmer">À confirmer</option>
                      <option value="indisponible">Indisponible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Quantité
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={editingDispo.quantity ?? ""}
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Marque
                    </label>
                    <input
                      type="text"
                      name="brand"
                      value={editingDispo.brand ?? ""}
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Note (optionnel)
                    </label>
                    <textarea
                      name="note"
                      value={editingDispo.note ?? ""}
                      rows={2}
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" onClick={() => setEditingDispo(null)}>
                    Annuler
                  </Button>
                  <Button type="submit" className="ml-auto">
                    Enregistrer
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {isAddMode && !editingDispo ? (
        <div className="mt-8 max-w-md">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Nouvelle disponibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveDispo}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Point de vente
                    </label>
                    <select
                      name="pointId"
                      required
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      {points.map((point) => (
                        <option key={point.id} value={point.id}>
                          {point.name} ({point.district})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Format de bouteille
                    </label>
                    <input
                      type="text"
                      name="format"
                      placeholder="ex: 12,5 kg, 6 kg"
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Statut
                    </label>
                    <select
                      name="status"
                      required
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    >
                      <option value="disponible">Disponible</option>
                      <option value="a_confirmer">À confirmer</option>
                      <option value="indisponible">Indisponible</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Quantité
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      min="0"
                      required
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Marque
                  </label>
                  <input
                    type="text"
                    name="brand"
                    placeholder="ex: Total, Tradex, Bocom"
                    className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Note (optionnel)
                  </label>
                  <textarea
                    name="note"
                    rows={2}
                    placeholder="Indication pour les clients"
                    className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" onClick={() => setShowAddForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Publier</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
