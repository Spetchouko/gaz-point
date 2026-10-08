"use client"

import { useState } from "react"
import { useActionState } from "react"
import { CheckCircle2, Loader2, X, Store, UserPlus, MapPin, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { createVendor, updateVendor, toggleVendorStatus, type ActionResult } from "@/app/admin/actions"

type VendorData = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  pointId?: string
  pointName?: string
  pointDistrict?: string
  pointAddress?: string
  pointPhone?: string | null
} | null

export function AdminVendeurForm({
  open,
  onClose,
  editingVendor,
}: {
  open: boolean
  onClose: () => void
  editingVendor: VendorData
}) {
  const isEditing = editingVendor !== null
  const isToggling = editingVendor && !editingVendor.id.startsWith("new-")

  const [formState, setFormState] = useState({
    name: editingVendor?.name ?? "",
    email: editingVendor?.email ?? "",
    phoneNumber: editingVendor?.phoneNumber ?? "",
    password: "",
    pointName: editingVendor?.pointName ?? "",
    pointDistrict: editingVendor?.pointDistrict ?? "",
    pointAddress: editingVendor?.pointAddress ?? "",
    pointPhone: editingVendor?.pointPhone ?? "",
  })

  const [step, setStep] = useState<"form" | "confirm">("form")
  const [feedback, setFeedback] = useState<ActionResult | null>(null)

  const createAction = async (_prev: ActionResult | null, formData: FormData) => {
    const result = await createVendor(null, formData)
    setFeedback(result)
    if (result.ok) onClose()
    return result
  }

  const updateAction = async (_prev: ActionResult | null, formData: FormData) => {
    const result = await updateVendor(null, formData)
    setFeedback(result)
    if (result.ok) onClose()
    return result
  }

  const toggleAction = async (_prev: ActionResult | null, formData: FormData) => {
    const result = await toggleVendorStatus(null, formData)
    setFeedback(result)
    if (result.ok) onClose()
    return result
  }

  if (!open) return null

  if (isToggling) {
    return (
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingVendor?.name?.includes("Désactiver") ? "Désactiver le vendeur" : "Activer le vendeur"}
            </DialogTitle>
          </DialogHeader>
          <form action={toggleAction} className="space-y-4">
            <input type="hidden" name="userId" value={editingVendor?.id ?? ""} />
            <input type="hidden" name="currentRole" value={editingVendor?.name?.includes("Désactiver") ? "vendor" : "client"} />
            <p className="text-sm text-muted-foreground">
              {editingVendor?.name?.includes("Désactiver")
                ? "Le vendeur deviendra un simple usager et ne pourra plus gérer de disponibilités."
                : "L'utilisateur deviendra un vendeur et pourra gérer des dépôts."}
            </p>
            <div className="flex gap-2">
              <Button type="submit" variant={editingVendor?.name?.includes("Désactiver") ? "destructive" : "default"} className="flex-1">
                Confirmer
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Annuler
              </Button>
            </div>
            {feedback && !feedback.ok && <p role="alert" className="text-sm text-destructive">{feedback.message}</p>}
            {feedback?.ok && <p role="status" className="text-sm text-emerald-600">{feedback.message}</p>}
          </form>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Modifier le vendeur" : "Créer un vendeur"}</DialogTitle>
        </DialogHeader>

        {step === "form" && (
          <form action={isEditing ? updateAction : createAction} className="space-y-4">
            {isEditing && <input type="hidden" name="userId" value={editingVendor?.id ?? ""} />}
            {isEditing && editingVendor?.pointId && <input type="hidden" name="pointId" value={editingVendor.pointId} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom du responsable</Label>
                <Input
                  id="name"
                  value={formState.name}
                  onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                  placeholder="Ex: Jean Dupont"
                  required
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formState.email}
                  onChange={(e) => setFormState((s) => ({ ...s, email: e.target.value }))}
                  placeholder="vendeur@email.com"
                  required
                  disabled={isEditing}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phoneNumber">Téléphone</Label>
                <Input
                  id="phoneNumber"
                  type="tel"
                  value={formState.phoneNumber}
                  onChange={(e) => setFormState((s) => ({ ...s, phoneNumber: e.target.value }))}
                  placeholder="+237 6 99 00 00 00"
                />
              </div>

              {!isEditing && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formState.password}
                    onChange={(e) => setFormState((s) => ({ ...s, password: e.target.value }))}
                    placeholder="6 caractères minimum"
                    required
                    minLength={6}
                    autoComplete="new-password"
                  />
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Store className="size-4" />
                Dépôt (optionnel)
              </h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="pointName">Nom du dépôt</Label>
                  <Input
                    id="pointName"
                    value={formState.pointName}
                    onChange={(e) => setFormState((s) => ({ ...s, pointName: e.target.value }))}
                    placeholder="Ex: Dépôt Gaz Bonamoussadi"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pointDistrict">Quartier</Label>
                  <Input
                    id="pointDistrict"
                    value={formState.pointDistrict}
                    onChange={(e) => setFormState((s) => ({ ...s, pointDistrict: e.target.value }))}
                    placeholder="Ex: Bonamoussadi"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="pointAddress">Adresse</Label>
                  <Input
                    id="pointAddress"
                    value={formState.pointAddress}
                    onChange={(e) => setFormState((s) => ({ ...s, pointAddress: e.target.value }))}
                    placeholder="Ex: Après Tradex, à côté de la pharmacie"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pointPhone">Téléphone du dépôt</Label>
                  <Input
                    id="pointPhone"
                    type="tel"
                    value={formState.pointPhone}
                    onChange={(e) => setFormState((s) => ({ ...s, pointPhone: e.target.value }))}
                    placeholder="+237 6 99 00 00 00"
                  />
                </div>
              </div>
            </div>

            {feedback && !feedback.ok && (
              <p role="alert" className="text-sm text-destructive">{feedback.message}</p>
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={!!feedback?.ok}>
                {isEditing ? "Enregistrer les modifications" : "Créer le vendeur"}
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Annuler
              </Button>
            </div>
          </form>
        )}

        {feedback?.ok && (
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="size-4" />
            {feedback.message}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}