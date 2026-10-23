"use client"

import { useState } from "react"
import { MapPin, Cylinder, Phone, Plus, ShieldCheck, Store, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { upsertDisponibilite, type ActionResult } from "@/app/dashboard/pro/actions"
import { DashboardNav } from "@/app/_components/dashboard-nav"
import { availabilityLabel } from "@/lib/gaz"
import type { AvailabilityStatus } from "@/db/schema"

const FORMATS = ["6 kg", "12,5 kg", "15 kg"] as const
const STATUSES: AvailabilityStatus[] = ["disponible", "indisponible"]

type PointWithDispos = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  disponibilites: {
    id: string
    format: string | null
    status: string
    phone: string | null
    quantity: number | null
    note: string | null
    createdAt: string | Date
  }[]
}

export function EspaceVendeur({
  vendorPhone,
  points,
}: {
  vendorPhone: string | null
  points: PointWithDispos[]
}) {
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingDispo, setEditingDispo] = useState<{
    dispo: PointWithDispos["disponibilites"][0]
    pointId: string
    pointName: string
  } | null>(null)

  const handleAddDispo = (point?: PointWithDispos) => {
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

  const handleCloseForm = () => {
    setIsFormOpen(false)
    setEditingDispo(null)
  }

  const handleEditDispo = (
    dispo: PointWithDispos["disponibilites"][0],
    pointId: string,
    pointName: string
  ) => {
    setEditingDispo({ dispo, pointId, pointName })
    setIsFormOpen(true)
  }

  if (points.length === 0) {
    return (
      <div className="min-h-screen bg-background py-12">
        <div className="container mx-auto max-w-2xl px-4">
          <DashboardNav pro={true} />
          <header className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight">Espace professionnel</h1>
            <p className="mt-2 text-muted-foreground">
              Renseigne la disponibilité du gaz de tes dépôts
            </p>
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
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto max-w-2xl px-4">
        <DashboardNav pro={true} />
        <header className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Espace professionnel</h1>
          <p className="mt-2 text-muted-foreground">
            Renseigne la disponibilité du gaz de tes dépôts
          </p>
        </header>

        {/* Formulaire de disponibilité */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="size-5 text-primary" aria-hidden />
              Publier une disponibilité
            </CardTitle>
            <CardDescription>
              Déclare le stock disponible dans ton point de vente. Cette information sera visible par les usagers.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full gap-2 sm:w-auto" onClick={() => handleAddDispo()}>
              <Plus className="size-4" />
              Publier une disponibilité
            </Button>
          </CardContent>
        </Card>

        {/* Disponibilités actuelles */}
        <div className="space-y-4">
          {points.map((point) => (
            <Card key={point.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Store className="size-4 text-primary" aria-hidden />
                  {point.name}
                </CardTitle>
                <CardDescription>
                  {point.address} — {point.district}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <DisponibiliteList
                  point={point}
                  onEdit={handleEditDispo}
                  onAdd={() => handleAddDispo(point)}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <DisponibiliteVendeurForm
          points={points}
          vendorPhone={vendorPhone}
          open={isFormOpen}
          onClose={handleCloseForm}
          editingDispo={editingDispo}
        />
      </div>
    </div>
  )
}

function DisponibiliteVendeurForm({
  points,
  vendorPhone,
  open,
  onClose,
  editingDispo,
}: {
  points: PointWithDispos[]
  vendorPhone: string | null
  open: boolean
  onClose: () => void
  editingDispo: {
    dispo: PointWithDispos["disponibilites"][0]
    pointId: string
    pointName: string
  } | null
}) {
  const isEditing = editingDispo?.dispo.id !== "" && editingDispo?.dispo.id !== undefined

  const [formState, setFormState] = useState({
    pointId: editingDispo?.pointId ?? "",
    format: editingDispo?.dispo.format ?? "",
    status: (editingDispo?.dispo.status as AvailabilityStatus) ?? "disponible",
    phone: editingDispo?.dispo.phone ?? vendorPhone ?? "",
    quantity: editingDispo?.dispo.quantity ?? "",
    directions: editingDispo?.dispo.note ?? "",
  })

  const [step, setStep] = useState<"form" | "confirm">("form")
  const [feedback, setFeedback] = useState<ActionResult | null>(null)

  const handleSubmit = async (formData: FormData) => {
    const result = await upsertDisponibilite(null, formData)
    setFeedback(result)
    if (result.ok) {
      onClose()
    }
  }

  if (!open) return null

  const selectedPoint = points.find((p) => p.id === formState.pointId)

  const confirmContent = (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm font-medium text-primary">
        <ShieldCheck className="size-4" />
        Confirme la disponibilité avant publication
      </div>
      <dl className="space-y-2 text-sm text-muted-foreground">
        <div className="flex justify-between">
          <dt>Dépôt</dt>
          <dd className="font-medium text-foreground">{selectedPoint?.name}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Format</dt>
          <dd className="font-medium text-foreground">{formState.format}</dd>
        </div>
        <div className="flex justify-between">
          <dt>Statut</dt>
          <dd className="font-medium text-foreground">
            {availabilityLabel[formState.status]}
          </dd>
        </div>
        {formState.quantity && (
          <div className="flex justify-between">
            <dt>Quantité</dt>
            <dd className="font-medium text-foreground">{formState.quantity}</dd>
          </div>
        )}
        {formState.directions && (
          <div className="flex justify-between">
            <dt>Indication</dt>
            <dd className="font-medium text-foreground">{formState.directions}</dd>
          </div>
        )}
        {formState.phone && (
          <div className="flex justify-between">
            <dt>Téléphone</dt>
            <dd className="font-medium text-foreground">{formState.phone}</dd>
          </div>
        )}
        <dd className="text-xs">
          La date et l&apos;heure de publication seront enregistrées automatiquement.
        </dd>
      </dl>
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-background rounded-xl shadow-sm p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? "Modifier la disponibilité" : "Publier une disponibilité"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            aria-label="Fermer"
          >
            <X className="size-5" />
          </button>
        </div>

        {step === "form" && (
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="pointId" value={formState.pointId} />
            <input type="hidden" name="format" value={formState.format} />
            <input type="hidden" name="status" value={formState.status} />
            <input type="hidden" name="phone" value={formState.phone} />
            <input type="hidden" name="quantity" value={formState.quantity} />
            <input type="hidden" name="directions" value={formState.directions} />
            {isEditing && (
              <input type="hidden" name="disponibiliteId" value={editingDispo?.dispo.id} />
            )}

            <div className="space-y-1.5">
              <Label htmlFor="point-select">Point de vente</Label>
              <Select
                value={formState.pointId}
                onValueChange={(v) => setFormState((s) => ({ ...s, pointId: v ?? "" }))}
                disabled={isEditing}
              >
                <SelectTrigger id="point-select" className="w-full" disabled={isEditing}>
                  <SelectValue placeholder="Sélectionne un dépôt" />
                </SelectTrigger>
                <SelectContent>
                  {points.map((point) => (
                    <SelectItem key={point.id} value={point.id}>
                      {point.name} — {point.district}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="format-select">Type de bouteille</Label>
                <Select
                  value={formState.format}
                  onValueChange={(v) => setFormState((s) => ({ ...s, format: v ?? "" }))}
                  required
                >
                  <SelectTrigger id="format-select" className="w-full">
                    <SelectValue placeholder="Sélectionner le format" />
                  </SelectTrigger>
                  <SelectContent>
                    {FORMATS.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="status-select">Statut</Label>
                <Select
                  value={formState.status}
                  onValueChange={(v) => setFormState((s) => ({ ...s, status: v as AvailabilityStatus }))}
                >
                  <SelectTrigger id="status-select" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((item) => (
                      <SelectItem key={item} value={item}>
                        {availabilityLabel[item]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="quantity-input">Quantité disponible</Label>
              <Input
                id="quantity-input"
                type="number"
                min="0"
                value={formState.quantity}
                onChange={(e) => setFormState((s) => ({ ...s, quantity: e.target.value }))}
                placeholder="Ex : 25"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="directions-input">Indication / itinéraire (facultatif)</Label>
              <Textarea
                id="directions-input"
                value={formState.directions}
                onChange={(e) => setFormState((s) => ({ ...s, directions: e.target.value }))}
                placeholder="Ex: Après Tradex, à côté de la pharmacie..."
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone-input">Téléphone (facultatif)</Label>
              <Input
                id="phone-input"
                type="tel"
                value={formState.phone}
                onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                placeholder="Ex: +237 6 99 00 00 00"
              />
            </div>

            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">
                {feedback.message}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="submit"
                className="flex-1"
                disabled={!!feedback?.ok}
              >
                {isEditing ? "Enregistrer les modifications" : "Publier la disponibilité"}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {step === "confirm" && (
          <form action={handleSubmit} className="space-y-4">
            <input type="hidden" name="pointId" value={formState.pointId} />
            <input type="hidden" name="format" value={formState.format} />
            <input type="hidden" name="status" value={formState.status} />
            <input type="hidden" name="phone" value={formState.phone} />
            <input type="hidden" name="quantity" value={formState.quantity} />
            <input type="hidden" name="directions" value={formState.directions} />
            {confirmContent}
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={!!feedback?.ok}>
                Confirmer la publication
              </Button>
              <Button type="button" variant="ghost" onClick={() => setStep("form")}>
                Modifier
              </Button>
            </div>
            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">{feedback.message}</p>
            )}
          </form>
        )}

        {feedback?.ok && (
          <div className="flex items-center gap-2 text-sm text-success">
            <Cylinder className="size-4" />
            {feedback.message}
          </div>
        )}
      </div>
    </div>
  )
}

function DisponibiliteList({
  point,
  onEdit,
  onAdd,
}: {
  point: PointWithDispos
  onEdit: (
    dispo: PointWithDispos["disponibilites"][0],
    pointId: string,
    pointName: string
  ) => void
  onAdd: () => void
}) {
  if (point.disponibilites.length === 0) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground text-center py-4">
          Aucune disponibilité enregistrée pour ce dépôt.
        </p>
        <Button variant="outline" className="w-full gap-2" onClick={onAdd}>
          <Cylinder className="size-4" />
          Ajouter la première disponibilité
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {point.disponibilites.map((dispo) => (
        <div
          key={dispo.id}
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border bg-card"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <span className="text-sm font-medium">{dispo.format ?? "—"}</span>
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {dispo.format ?? "Format non défini"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {dispo.quantity !== null
                    ? `${dispo.quantity} bouteille{dispo.quantity > 1 ? "s" : ""}`
                    : "Quantité non définie"}
                  {' '}· {dispo.createdAt ? new Date(dispo.createdAt).toLocaleDateString("fr-FR") : ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
            {dispo.note && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <MapPin className="size-3" />
                {dispo.note}
              </span>
            )}
            {dispo.phone && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <Phone className="size-3" />
                {dispo.phone}
              </span>
            )}

            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => onEdit(dispo, point.id, point.name)}
            >
              <Cylinder className="size-3.5" />
              Modifier
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => onEdit(
                { ...dispo, status: dispo.status === "disponible" ? "indisponible" : "disponible" },
                point.id,
                point.name
              )}
            >
              {dispo.status === "disponible" ? "Rupture" : "Disponible"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  )
}