"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Store, Plus, MapPin, Trash2, Edit, X, Loader2, Cylinder, Shield } from "lucide-react"
import { PhoneInput } from "@/app/_components/phone-input"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"
import type { ActionResult } from "@/app/dashboard/pro/actions"

const pointDeVenteSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  district: z.string().min(2, "Le quartier doit contenir au moins 2 caractères"),
  address: z.string().min(5, "L'adresse doit contenir au moins 5 caractères"),
  phone: z.string().optional().nullable(),
})

type PointDeVenteFormValues = z.infer<typeof pointDeVenteSchema>

type PointRow = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  isActive: boolean
  createdAt: Date
  dispoCount: number
}

type PointsDeVenteClientProps = {
  userName: string
  userEmail: string | null | undefined
  points: PointRow[]
  onCreatePoint: (formData: FormData) => Promise<ActionResult>
  onUpdatePoint: (formData: FormData) => Promise<ActionResult>
  onDeletePoint: (formData: FormData) => Promise<ActionResult>
}

export function PointsDeVenteClient({
  userName,
  userEmail,
  points,
  onCreatePoint,
  onUpdatePoint,
  onDeletePoint,
}: PointsDeVenteClientProps) {
  const [editingPoint, setEditingPoint] = useState<PointRow | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionResult, setActionResult] = useState<{ ok: boolean; message: string } | null>(null)
  const router = useRouter()

  const form = useForm<PointDeVenteFormValues>({
    resolver: zodResolver(pointDeVenteSchema),
    defaultValues: {
      name: "",
      district: "",
      address: "",
      phone: null,
    },
  })

  const isEditMode = !!editingPoint

  const openAddModal = () => {
    form.reset({
      name: "",
      district: "",
      address: "",
      phone: null,
    })
    setEditingPoint(null)
    setIsAddDialogOpen(true)
  }

  const openEditModal = (point: PointRow) => {
    form.reset({
      name: point.name,
      district: point.district,
      address: point.address,
      phone: point.phone ?? null,
    })
    setEditingPoint(point)
    setIsEditDialogOpen(true)
  }

  const closeAddDialog = () => {
    setIsAddDialogOpen(false)
    setActionResult(null)
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingPoint(null)
    setActionResult(null)
  }

  const handleSubmit = async (values: PointDeVenteFormValues) => {
    setIsSubmitting(true)
    setActionResult(null)
    try {
      const formData = new FormData()
      formData.set("name", values.name)
      formData.set("district", values.district)
      formData.set("address", values.address)
      if (values.phone) formData.set("phone", values.phone)

      let result: { ok: boolean; message: string }
      if (isEditMode && editingPoint) {
        formData.set("pointId", editingPoint.id)
        formData.set("isActive", "true")
        result = await onUpdatePoint(formData)
      } else {
        result = await onCreatePoint(formData)
      }

      setActionResult(result)
      if (result.ok) {
        toast.success(result.message)
        form.reset()
        if (isEditMode) {
          closeEditDialog()
        } else {
          closeAddDialog()
        }
        // Refresh the page to show updated data
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (pointId: string) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("pointId", pointId)
      const result = await onDeletePoint(formData)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
      setIsDeleteDialogOpen(false)
      setDeleteConfirmId(null)
    }
  }

  const handleToggle = async (pointId: string, isActive: boolean) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      formData.set("pointId", pointId)
      formData.set("isActive", isActive ? "false" : "true")
      const result = await onUpdatePoint(formData)
      if (result.ok) {
        toast.success(result.message)
        router.refresh()
      } else {
        toast.error(result.message)
      }
    } catch (error) {
      console.error("Erreur:", error)
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header avec titre et bouton d'ajout */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mes points de vente</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gérez vos points de vente et leurs disponibilités
          </p>
        </div>
        <Button onClick={openAddModal}>
          <Plus className="size-4" /> Ajouter un point de vente
        </Button>
      </div>

      {/* Raccourcis rapides */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/vendeur/disponibilites")}>
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Cylinder className="size-5" />
            </div>
            <div>
              <h3 className="font-medium">Créer une disponibilité</h3>
              <p className="text-sm text-muted-foreground">Publier une nouvelle disponibilité de gaz</p>
            </div>
          </CardContent>
        </Card>
        <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer" onClick={() => router.push("/dashboard/vendeur/disponibilites")}>
          <CardContent className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-success/10 text-success">
              <Shield className="size-5" />
            </div>
            <div>
              <h3 className="font-medium">Gérer mes disponibilités</h3>
              <p className="text-sm text-muted-foreground">Consulter et modifier les disponibilités publiées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des points de vente ou état vide */}
      {points.length === 0 ? (
        <div className="min-h-[300px] flex flex-col items-center justify-center py-12 border border-border/50 rounded-xl">
          <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Store className="size-6" />
          </span>
          <p className="font-medium">Aucun point de vente pour l'instant</p>
          <p className="text-sm text-muted-foreground max-w-md text-center">
            Ajoutez votre premier point de vente pour commencer à gérer vos disponibilités de gaz.
          </p>
          <Button onClick={openAddModal} className="mt-4">
            <Plus className="size-4" /> Ajouter un point de vente
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {points.map((point) => (
            <Card
              key={point.id}
              className="border border-border rounded-xl bg-white p-4 shadow-sm hover:shadow-md transition-sm"
            >
              <CardHeader className="flex flex-wrap items-start justify-between gap-2 pb-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="flex items-center gap-2 text-base truncate">
                    <Store className="size-4 text-primary shrink-0" aria-hidden />
                    {point.name}
                  </CardTitle>
                  <CardDescription className="mt-1 flex items-center gap-1.5 truncate">
                    <MapPin className="size-3.5 shrink-0" aria-hidden />
                    {point.address} — {point.district}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {point.isActive ? (
                    <Badge variant="outline" className="text-sm">
                      Actif
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="text-sm">
                      Inactif
                    </Badge>
                  )}
                  <Badge variant="secondary" className="text-sm">
                    {point.dispoCount} disponibilité{point.dispoCount > 1 ? "s" : ""}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => openEditModal(point)}
                  >
                    <Edit className="size-3" /> Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => router.push(`/dashboard/vendeur/disponibilites?pointId=${point.id}`)}
                  >
                    <Cylinder className="size-3" /> Disponibilités
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      setDeleteConfirmId(point.id)
                      setIsDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="size-3" /> Supprimer
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

          {/* Carte d'ajout en bas de liste */}
          <Card className="border-dashed border-2 border-border hover:border-primary/50 transition-colors" onClick={openAddModal}>
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
                <Plus className="size-6" />
              </div>
              <h3 className="font-medium text-lg">Ajouter un point de vente</h3>
              <p className="text-sm text-muted-foreground mt-1">Cliquez pour créer un nouveau point de vente</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-lg bg-card p-4 shadow-sm border-border mt-4">
          <DialogHeader className="pb-3">
            <DialogTitle>Ajouter un point de vente</DialogTitle>
            <DialogDescription>
              Renseignez les informations de votre nouveau point de vente.
            </DialogDescription>
          </DialogHeader>

          <PointDeVenteForm
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEditMode={false}
            onClose={closeAddDialog}
            actionResult={actionResult}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg rounded-lg bg-card p-4 shadow-sm border-border">
          <DialogHeader className="pb-3">
            <DialogTitle>Modifier le point de vente</DialogTitle>
            <DialogDescription>
              Mettez à jour les informations de votre point de vente.
            </DialogDescription>
          </DialogHeader>

          <PointDeVenteForm
            form={form}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            isEditMode={true}
            onClose={closeEditDialog}
            actionResult={actionResult}
            point={editingPoint}
            onToggle={handleToggle}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce point de vente ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteConfirmId &&
                points.find((p) => p.id === deleteConfirmId) &&
                `Cette action est irréversible. Le point de vente « ${points.find((p) => p.id === deleteConfirmId)?.name} » sera définitivement supprimé.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="size-4 animate-spin mr-2" />
                  Suppression...
                </>
              ) : (
                "Supprimer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function PointDeVenteForm({
  form,
  onSubmit,
  isSubmitting,
  isEditMode,
  onClose,
  actionResult,
  point,
  onToggle,
}: {
  form: ReturnType<typeof useForm<PointDeVenteFormValues>>
  onSubmit: (values: PointDeVenteFormValues) => Promise<void>
  isSubmitting: boolean
  isEditMode: boolean
  onClose: () => void
  actionResult: { ok: boolean; message: string } | null
  point?: PointRow | null
  onToggle?: (pointId: string, isActive: boolean) => Promise<void>
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      {actionResult && !actionResult.ok && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {actionResult.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
            Nom du point de vente
          </label>
          <input
            id="name"
            {...form.register("name")}
            className={cn(
              "mt-1 block w-full rounded-lg border border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary",
              form.formState.errors.name && "border-destructive"
            )}
            disabled={isSubmitting}
            aria-invalid={!!form.formState.errors.name}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="district" className="block text-sm font-medium text-muted-foreground">
            Quartier
          </label>
          <input
            id="district"
            {...form.register("district")}
            className={cn(
              "mt-1 block w-full rounded-lg border border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary",
              form.formState.errors.district && "border-destructive"
            )}
            disabled={isSubmitting}
            aria-invalid={!!form.formState.errors.district}
          />
          {form.formState.errors.district && (
            <p className="mt-1 text-sm text-destructive" role="alert">
              {form.formState.errors.district.message}
            </p>
          )}
        </div>
      </div>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-muted-foreground">
          Adresse complète
        </label>
        <input
          id="address"
          {...form.register("address")}
          className={cn(
            "mt-1 block w-full rounded-lg border border-input px-3 py-2 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary",
            form.formState.errors.address && "border-destructive"
          )}
          disabled={isSubmitting}
          aria-invalid={!!form.formState.errors.address}
        />
        {form.formState.errors.address && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {form.formState.errors.address.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-muted-foreground">
          Téléphone (optionnel)
        </label>
        <PhoneInput
          id="phone"
          name="phone"
          label="Téléphone (optionnel)"
          value={form.watch("phone") ?? undefined}
          onChange={(normalized) => form.setValue("phone", normalized, { shouldValidate: true })}
          className={cn(
            "mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary pl-8",
            form.formState.errors.phone && "border-destructive"
          )}
          disabled={isSubmitting}
        />
        {form.formState.errors.phone && (
          <p className="mt-1 text-sm text-destructive" role="alert">
            {form.formState.errors.phone.message}
          </p>
        )}
      </div>

      {isEditMode && point && onToggle && (
        <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border">
          <div>
            <p className="font-medium">Statut du point de vente</p>
            <p className="text-sm text-muted-foreground">
              {point.isActive ? "Actif - Les clients peuvent voir ce point de vente" : "Inactif - Masqué aux clients"}
            </p>
          </div>
          <Button
            variant={point.isActive ? "outline" : "default"}
            size="sm"
            onClick={() => onToggle(point.id, point.isActive)}
            disabled={isSubmitting}
          >
            {point.isActive ? "Désactiver" : "Activer"}
          </Button>
        </div>
      )}

      <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onClose}
          disabled={isSubmitting}
        >
          Annuler
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin mr-2" />
              Enregistrement...
            </>
          ) : isEditMode ? (
            "Enregistrer les modifications"
          ) : (
            "Enregistrer le point de vente"
          )}
        </Button>
      </DialogFooter>
    </form>
  )
}

function formatDate(date: Date | string | null | undefined) {
  if (!date) return "—"
  return new Date(date).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  })
}