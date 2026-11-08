"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { toast } from "sonner"
import {
  Store,
  Plus,
  X,
  LogOut,
  MapPin,
  Edit,
  Loader2,
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
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"
import { cn } from "@/lib/utils"

const dispoSchema = z.object({
  pointId: z.string().min(1, "Sélectionnez un point de vente"),
  pointName: z.string().optional(),
  format: z.string().optional().nullable(),
  status: z.enum(["disponible", "a_confirmer", "indisponible"]),
  note: z.string().optional().nullable(),
  quantity: z.number().nullable().optional(),
  brand: z.string().optional().nullable(),
})

type DispoFormValues = z.infer<typeof dispoSchema>

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
  onSaveDispo: (values: DispoFormValues) => Promise<void>
  onUpdateDispo: (dispoId: string, values: DispoFormValues) => Promise<void>
  onDeleteDispo: (dispoId: string) => Promise<void>
}

export function DisponibilitesClient({
  userName,
  userEmail,
  points,
  allDispos,
  onSaveDispo,
  onUpdateDispo,
  onDeleteDispo,
}: DisponibilitesClientProps) {
  const [editingDispo, setEditingDispo] = useState<DispoRow | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<DispoFormValues>({
    resolver: zodResolver(dispoSchema),
    defaultValues: {
      pointId: "",
      pointName: "",
      format: null,
      status: "disponible",
      note: null,
      quantity: null,
      brand: null,
    },
  })

  const isEditMode = !!editingDispo

  const disposByPoint = new Map<string, DispoRow[]>()
  allDispos.forEach((d) => {
    const existing = disposByPoint.get(d.pointId) ?? []
    existing.push(d)
    disposByPoint.set(d.pointId, existing)
  })

  const openAddModal = () => {
    form.reset({
      pointId: "",
      pointName: "",
      format: null,
      status: "disponible",
      note: null,
      quantity: null,
      brand: null,
    })
    setEditingDispo(null)
    setIsAddDialogOpen(true)
  }

  const openEditModal = (dispo: DispoRow, pointName: string) => {
    form.reset({
      pointId: dispo.pointId,
      pointName: pointName,
      format: dispo.format,
      status: dispo.status as "disponible" | "a_confirmer" | "indisponible",
      note: dispo.note,
      quantity: dispo.quantity,
      brand: dispo.brand,
    })
    setEditingDispo(dispo)
    setIsEditDialogOpen(true)
  }

  const closeDialogs = () => {
    setIsAddDialogOpen(false)
    setIsEditDialogOpen(false)
    setEditingDispo(null)
  }

  const handleSubmit = async (values: DispoFormValues) => {
    setIsSubmitting(true)
    try {
      if (isEditMode && editingDispo) {
        await onUpdateDispo(editingDispo.id, values)
        toast.success("Disponibilité modifiée avec succès")
      } else {
        await onSaveDispo(values)
        toast.success("Disponibilité publiée avec succès")
      }
      form.reset()
      closeDialogs()
    } catch (error) {
      console.error("Erreur lors de l'enregistrement:", error)
      toast.error("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (dispoId: string) => {
    setIsSubmitting(true)
    try {
      await onDeleteDispo(dispoId)
      toast.success("Disponibilité supprimée")
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
    <div>
      <div className="pt-4 border-b border-muted/20">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Disponibilités</h1>
          <Button variant="ghost" size="icon" aria-label="Tableau de bord" onClick={() => window.location.href = "/dashboard/vendeur"}>
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
              {allDispos.filter((d) => d.status === "disponible" && d.quantity && d.quantity > 0).length}
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
                    <Button variant="ghost" size="sm" onClick={openAddModal}>
                      <Plus className="size-4" /> Ajouter
                    </Button>
                  </div>
                ) : (
                  <div className="p-4">
                    {pointDispos.map((dispo) => {
                      const effective = dispo.status as "disponible" | "indisponible" | "a_confirmer"
                      return (
                        <div key={dispo.id} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-sm mb-3">
                          <div>
                            <p className="text-muted-foreground">Format</p>
                            <p className="font-medium">{dispo.format ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Marque</p>
                            <p className="font-medium">{dispo.brand ?? "—"}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Statut</p>
                            <Badge variant="outline" className={cn("shrink-0", availabilityBadgeClass[effective])}>
                              {availabilityLabel[effective]}
                            </Badge>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Quantité</p>
                            <p className="font-medium">
                              {dispo.quantity !== null ? `${dispo.quantity} bouteille${dispo.quantity > 1 ? "s" : ""}` : "—"}
                            </p>
                          </div>
                        </div>
                      )
                    })}

                    <div className="pt-3 border-t border-muted/20 flex flex-wrap gap-2">
                      {pointDispos.map((dispo) => (
                        <Button
                          key={dispo.id}
                          variant="ghost"
                          size="sm"
                          className="flex-1 min-w-[120px]"
                          onClick={() => openEditModal(dispo, point.name)}
                        >
                          <Edit className="size-4" aria-hidden /> Voir détails
                        </Button>
                      ))}
                      {pointDispos.map((dispo) => (
                        <Button
                          key={`delete-${dispo.id}`}
                          variant="destructive"
                          size="sm"
                          className="flex-1 min-w-[120px]"
                          onClick={() => {
                            setDeleteConfirmId(dispo.id)
                            setIsDeleteDialogOpen(true)
                          }}
                        >
                          <LogOut className="size-4" /> Supprimer
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nouvelle disponibilité</DialogTitle>
            <DialogDescription>Publiez une nouvelle disponibilité de gaz.</DialogDescription>
          </DialogHeader>
          <DispoForm form={form} onSubmit={handleSubmit} isSubmitting={isSubmitting} isEditMode={false} onClose={closeDialogs} points={points} />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la disponibilité</DialogTitle>
            <DialogDescription>Mettez à jour les informations de cette disponibilité.</DialogDescription>
          </DialogHeader>
          <DispoForm form={form} onSubmit={handleSubmit} isSubmitting={isSubmitting} isEditMode={true} onClose={closeDialogs} points={points} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette disponibilité ?</AlertDialogTitle>
            <AlertDialogDescription>Cette action est irréversible. La disponibilité sera définitivement supprimée.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)} disabled={isSubmitting}>
              {isSubmitting ? (<> <Loader2 className="size-4 animate-spin mr-2" /> Suppression... </>) : ("Supprimer")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function DispoForm({
  form,
  onSubmit,
  isSubmitting,
  isEditMode,
  onClose,
  points,
}: {
  form: ReturnType<typeof useForm<DispoFormValues>>
  onSubmit: (values: DispoFormValues) => Promise<void>
  isSubmitting: boolean
  isEditMode: boolean
  onClose: () => void
  points: PointRow[]
}) {
  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="pointId" className="block text-sm font-medium text-muted-foreground">Point de vente</label>
        <select id="pointId" {...form.register("pointId")} className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary" disabled={isEditMode}>
          {points.map((point) => (
            <option key={point.id} value={point.id}>{point.name} ({point.district})</option>
          ))}
        </select>
        {form.formState.errors.pointId && <p className="mt-1 text-sm text-destructive" role="alert">{form.formState.errors.pointId.message}</p>}
      </div>

      <div>
        <label htmlFor="format" className="block text-sm font-medium text-muted-foreground">Format de bouteille</label>
        <input id="format" type="text" {...form.register("format")} placeholder="ex: 12,5 kg, 6 kg" className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary" disabled={isSubmitting} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="status" className="block text-sm font-medium text-muted-foreground">Statut</label>
          <select id="status" {...form.register("status")} className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary" disabled={isSubmitting}>
            <option value="disponible">Disponible</option>
            <option value="a_confirmer">À confirmer</option>
            <option value="indisponible">Indisponible</option>
          </select>
        </div>
        <div>
          <label htmlFor="quantity" className="block text-sm font-medium text-muted-foreground">Quantité</label>
          <input id="quantity" type="number" min="0" {...form.register("quantity", { valueAsNumber: true })} className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary" disabled={isSubmitting} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="brand" className="block text-sm font-medium text-muted-foreground">Marque</label>
          <input id="brand" type="text" {...form.register("brand")} placeholder="ex: Total, Tradex, Bocom" className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary" disabled={isSubmitting} />
        </div>
        <div>
          <label htmlFor="note" className="block text-sm font-medium text-muted-foreground">Note (optionnel)</label>
          <textarea id="note" rows={2} {...form.register("note")} placeholder="Indication pour les clients" className="mt-1 block w-full rounded-lg border border-input px-3 py-2 focus:ring-2 focus:ring-primary/50 focus:border-primary" disabled={isSubmitting} />
        </div>
      </div>

      <DialogFooter className="flex justify-end gap-3 pt-4 border-t border-border mt-2">
        <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>Annuler</Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (<> <Loader2 className="size-4 animate-spin mr-2" /> Enregistrement... </>) : (isEditMode ? "Enregistrer les modifications" : "Publier la disponibilité")}
        </Button>
      </DialogFooter>
    </form>
  )
}