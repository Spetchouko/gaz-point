"use client"

import { asc, eq, inArray } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { useState } from "react"
import {
  Store,
  Plus,
  TrendingUp,
  CheckCircle2,
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

export const metadata: Metadata = {
  title: { absolute: "Disponibilités | GazPoints" },
}

export default async function DisponibilitesPage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  // Récupérer tous les points de vente du vendeur avec leurs disponibilités
  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  // Récupérer toutes les disponibilités de tous les points
  const allDispos = await db
    .select({
      id: disponibilite.id,
      pointId: disponibilite.pointId,
      status: disponibilite.status,
      note: disponibilite.note,
      quantity: disponibilite.quantity,
      format: disponibilite.format,
      brand: disponibilite.brand,
      createdAt: disponibilite.createdAt,
    })
    .from(disponibilite)
    .where(inArray(disponibilite.vendorId, [user.id]))

  // regrouper par point de vente
  const pointMap = new Map(
    points.map((p) => [p.id, { name: p.name, district: p.district }])
  )

  const disposByPoint = new Map<string, typeof allDispos[0][]>()
  allDispos.forEach((d) => {
    const existing = disposByPoint.get(d.pointId) ?? []
    existing.push(d)
    disposByPoint.set(d.pointId, existing)
  })

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

  // Gérer l'ajout/édition de disponibilité
  const handleSaveDispo = async (values: {
    pointId: string
    pointName: string
    format: string | null
    status: string
    note: string | null
    quantity: number | null
    brand: string | null
  }) => {
    if (editingDispo?.id) {
      // Mise à jour
      await db
        .update(disponibilite)
        .set({
          status: values.status,
          note: values.note,
          quantity: values.quantity,
          format: values.format,
          brand: values.brand,
          updatedAt: new Date(),
        })
        .where(eq(disponibilite.id, editingDispo.id))
      setEditingDispo(null)
    } else {
      // Création
      await db.insert(disponibilite).values({
        id: crypto.randomUUID(),
        pointId: values.pointId,
        vendorId: user.id,
        status: values.status,
        note: values.note,
        quantity: values.quantity,
        format: values.format,
        brand: values.brand,
        reportedBy: user.id,
        reportedByName: user.name ?? "Vendeur",
        source: "vendeur",
        createdAt: new Date(),
      })
    }
    setShowAddForm(false)
    window.location.href = "/dashboard/vendeur/disponibilites"
  }

  // Supprimer une disponibilité avec confirmation
  const handleDeleteDispo = async (dispoId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer cette disponibilité ?")) {
      await db
        .delete(disponibilite)
        .where(eq(disponibilite.id, dispoId))
      window.location.href = "/dashboard/vendeur/disponibilites"
    }
  }

  return (
    <VendorLayout
      role={role}
      vendorName={user.name ?? "Vendeur"}
      vendorEmail={user.email}
    >
      {/* En-tête */}
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

      {/* Statistiques rapides */}
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

      {/* Liste des disponibilités grouped by point */}
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

                {/* Actions */}
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

      {/* Formulaire d'ajout/édition de disponibilité */}
      {showAddForm && editingDispo ? (
        /* Mode édition */
        <div className="mt-8 max-w-md">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Modifier la disponibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e: React.FormEvent) => {
                  e.preventDefault()
                  await handleSaveDispo({
                    pointId: editingDispo.pointId,
                    pointName: editingDispo.pointName,
                    format: editingDispo.format,
                    status: editingDispo.status,
                    note: editingDispo.note,
                    quantity: editingDispo.quantity,
                    brand: editingDispo.brand,
                  })
                }}
              >
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
      ) : showAddForm && !editingDispo ? (
        /* Mode ajout */
        <div className="mt-8 max-w-md">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Nouvelle disponibilité</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e: React.FormEvent) => {
                  e.preventDefault()
                  await handleSaveDispo({
                    pointId: (e.target as any).pointId.value,
                    pointName: points.find(
                      (p) => p.id === (e.target as any).pointId.value
                    )?.name ?? "",
                    format: (e.target as any).format.value,
                    status: (e.target as any).status.value,
                    note: (e.target as any).note.value,
                    quantity: Number((e.target as any).quantity.value) || null,
                    brand: (e.target as any).brand.value || null,
                  })
                }}
              >
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
    </VendorLayout>
  )
}

// Helper function pour formater les dates
function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
}

// Helper function pour le statut effectif
function effectiveStatus(
  status: string,
  createdAt: Date | string
): "disponible" | "indisponible" | "a_confirmer" {
  return status as "disponible" | "indisponible" | "a_confirmer"
}
