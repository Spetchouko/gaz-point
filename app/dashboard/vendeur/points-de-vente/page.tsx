"use client"

import { asc, eq } from "drizzle-orm"
import type { Metadata } from "next"
import { db } from "@/db"
import { pointDeVente } from "@/db/schema"
import { VendorLayout } from "@/app/_components/vendor-layout"
import { requirePro } from "@/lib/session"
import { useState } from "react"
import { Store, Plus, TrendingUp, CheckCircle2, X, MapPin, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export const metadata: Metadata = {
  title: { absolute: "Mes points de vente | GazPoints" },
}

export default async function PointsDeVentePage() {
  const { user, role } = await requirePro()

  if (role !== "vendor") {
    return <div>Accès réservé aux vendeurs.</div>
  }

  // Récupérer les points de vente du vendeur
  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
      address: pointDeVente.address,
      phone: pointDeVente.phone,
      isActive: pointDeVente.isActive,
      createdAt: pointDeVente.createdAt,
    })
    .from(pointDeVente)
    .where(eq(pointDeVente.vendorId, user.id))
    .orderBy(asc(pointDeVente.name))

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingPoint, setEditingPoint] = useState<{
    id: string | null
    name: string
    district: string
    address: string
    phone: string | null
  } | null>(null)

  // Gérer l'ajout/édition du point de vente
  const handleSavePoint = async (values: {
    name: string
    district: string
    address: string
    phone: string | null
  }) => {
    if (editingPoint?.id) {
      // Mise à jour
      await db
        .update(pointDeVente)
        .set({
          name: values.name,
          district: values.district,
          address: values.address,
          phone: values.phone,
          updatedAt: new Date(),
        })
        .where(eq(pointDeVente.id, editingPoint.id))
      setEditingPoint(null)
    } else {
      // Création
      await db.insert(pointDeVente).values({
        id: crypto.randomUUID(),
        name: values.name,
        district: values.district,
        address: values.address,
        phone: values.phone,
        vendorId: user.id,
        isActive: true,
        createdAt: new Date(),
      })
    }
    setShowAddForm(false)
    // Recharger les données
    window.location.href = "/dashboard/vendeur/points-de-vente"
  }

  // Supprimer un point de vente avec confirmation
  const handleDeletePoint = async (pointId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce point de vente ?")) {
      await db
        .delete(pointDeVente)
        .where(eq(pointDeVente.id, pointId))
      window.location.href = "/dashboard/vendeur/points-de-vente"
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
            Mes points de vente
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

      {/* Message si aucun point de vente */}
      {points.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center py-12">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Store className="size-6" />
          </span>
          <p className="font-medium">Aucun point de vente pour l'instant</p>
          <p className="text-sm text-muted-foreground max-w-md">
            Ajoutez votre premier point de vente pour commencer à gérer vos disponibilités de gaz.
          </p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="mt-4 mt-auto"
          >
            <Plus className="size-4" /> Ajouter un point de vente
          </Button>
        </div>
      ) : (
        /* Liste des points de vente */
        <div className="space-y-4">
          {points.map((point) => (
            <Card key={point.id} className="hover:shadow-sm transition-shadow">
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
                  {point.isActive && (
                    <Badge variant="outline" className="text-sm">
                      Actif
                    </Badge>
                  )}
                  {!point.isActive && (
                    <Badge variant="destructive" className="text-sm">
                      Inactif
                    </Badge>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => setEditingPoint({
                      id: point.id,
                      name: point.name,
                      district: point.district,
                      address: point.address,
                      phone: point.phone ?? null,
                    })}
                  >
                    <X className="size-3" /> Modifier
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={() => handleDeletePoint(point.id)}
                  >
                    <LogOut className="size-3" /> Supprimer
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quartier</p>
                    <p className="font-medium truncate">{point.district}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Adresse</p>
                    <p className="font-medium truncate">{point.address}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Téléphone</p>
                    <p className="font-medium">
                      {point.phone ?? "Non indiqué"}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Enregistré le</p>
                    <p className="font-medium">
                      {point.createdAt ? formatDate(new Date(point.createdAt)) : "—"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Formulaire d'ajout/édition */}
      {showAddForm && editingPoint ? (
        /* Mode édition */
        <div className="mt-8 max-w-md">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Modifier le point de vente</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e: React.FormEvent) => {
                  e.preventDefault()
                  await handleSavePoint({
                    name: (e.target as any).name.value,
                    district: (e.target as any).district.value,
                    address: (e.target as any).address.value,
                    phone: (e.target as any).phone.value === "" ? null : (e.target as any).phone.value,
                  })
                }}
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Nom du point de vente
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={editingPoint?.name ?? ""}
                      required
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Quartier
                    </label>
                    <input
                      type="text"
                      name="district"
                      value={editingPoint?.district ?? ""}
                      required
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Adresse complète
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={editingPoint?.address ?? ""}
                    required
                    className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                {editingPoint?.phone && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Téléphone (optionnel)
                    </label>
                    <input
                      type="text"
                      name="phone"
                      value={editingPoint?.phone ?? ""}
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                )}
                <div className="flex justify-end gap-3">
                  <Button type="button" onClick={() => setEditingPoint(null)}>
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
      ) : showAddForm && !editingPoint ? (
        /* Mode ajout */
        <div className="mt-8 max-w-md">
          <Card className="p-6">
            <CardHeader>
              <CardTitle>Nouveau point de vente</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={async (e: React.FormEvent) => {
                  e.preventDefault()
                  await handleSavePoint({
                    name: (e.target as any).name.value,
                    district: (e.target as any).district.value,
                    address: (e.target as any).address.value,
                    phone: (e.target as any).phone.value === "" ? null : (e.target as any).phone.value,
                  })
                }}
              >
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground">
                      Nom du point de vente
                    </label>
                    <input
                      type="text"
                      name="name"
                      required
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
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
                      className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Adresse complète
                  </label>
                  <input
                    type="text"
                    name="address"
                    required
                    className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground">
                    Téléphone (optionnel)
                  </label>
                  <input
                    type="text"
                    name="phone"
                    className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" onClick={() => setShowAddForm(false)}>
                    Annuler
                  </Button>
                  <Button type="submit">Créer</Button>
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
