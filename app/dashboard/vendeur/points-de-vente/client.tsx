"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import { Store, Plus, MapPin, Trash2, Edit, X, Loader2 } from "lucide-react"
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
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogTrigger,
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
}

type PointsDeVenteClientProps = {
  userName: string
  userEmail: string | null | undefined
  points: PointRow[]
  onSavePoint: (values: PointDeVenteFormValues) => Promise<void>
  onUpdatePoint: (pointId: string, values: PointDeVenteFormValues) => Promise<void>
  onDeletePoint: (pointId: string) => Promise<void>
}

export function PointsDeVenteClient({
  userName,
  userEmail,
  points,
  onSavePoint,
  onUpdatePoint,
  onDeletePoint,
}: PointsDeVenteClientProps) {
  const [editingPoint, setEditingPoint] = useState<PointRow | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
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
  }

  const closeEditDialog = () => {
    setIsEditDialogOpen(false)
    setEditingPoint(null)
  }

  const handleSubmit = async (values: PointDeVenteFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && editingPoint) {
        await onUpdatePoint(editingPoint.id, values)
        toast.success("Point de vente modifié avec succès")
      } else {
        await onSavePoint(values)
        toast.success("Point de vente créé avec succès")
      }
      form.reset()
      if (isEditMode) {
        closeEditDialog()
      } else {
        closeAddDialog()
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
      await onDeletePoint(pointId)
      toast.success("Point de vente supprimé")
    } catch (error) {
      console.error("Erreur lors de la suppression:", error)
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
      setIsDeleteDialogOpen(false)
      setDeleteConfirmId(null)
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
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-1"
                    onClick={() => openEditModal(point)}
                  >
                    <Edit className="size-3" /> Modifier
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
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => {
                      router.push(`/dashboard/vendeur/disponibilites?pointId=${point.id}`)
                    }}
                  >
                    <Plus className="size-3" /> Gérer disponibilités
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

      {/* Add Dialog - compact card style, appears below the cards */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent
          className="max-w-md sm:max-w-lg rounded-lg bg-card p-4 shadow-sm border-border mt-4"
        >
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
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - compact card style */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent
          className="max-w-md sm:max-w-lg rounded-lg bg-card p-4 shadow-sm border-border"
        >
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
                `Cette action est irréversible. Le point devente « ${points.find((p) => p.id === deleteConfirmId)?.name} » sera définitivement supprimé.`}
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
}: {
  form: ReturnType<typeof useForm<PointDeVenteFormValues>>
  onSubmit: (values: PointDeVenteFormValues) => Promise<void>
  isSubmitting: boolean
  isEditMode: boolean
  onClose: () => void
}) {
  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-3">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-muted-foreground">
            Nom du point de vente
          </label>
          <input
            id="name"
            {...form.register("name")}
            className={cn(
              "mt-1 block w-full rounded-lg border border-input px-3 py-2 text-sm focus-ring-2 focus:ring-primary/50 focus:border-primary",
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
              "mt-1 block w-full rounded-lg border border-input px-3 py-2 text-sm focus-ring-2 focus:ring-primary/50 focus:border-primary",
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
            "mt-1 block w-full rounded-lg border border-input px-3 py-2 text-sm focus-ring-2 focus:ring-primary/50 focus:border-primary",
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
            "mt-1 block w-full rounded-lg border border-input px-3 py-2 focus-ring-2 focus:ring-primary/50 focus:border-primary pl-8",
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
      <DialogFooter
        className="flex justify-end gap-3 pt-4 border-t border-border mt-2"
      >
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