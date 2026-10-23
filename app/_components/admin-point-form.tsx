"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createPoint, updatePoint, assignVendorToPoint, type ActionResult } from "@/app/admin/actions"
import { cn } from "@/lib/utils"

export type PointOption = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[] | null
  formats: string[] | null
  vendorId: string | null
  vendorName: string | null
}

export type VendorOption = {
  id: string
  name: string
}

export function AdminPointForm({
  open,
  onClose,
  mode,
  point,
  vendors,
}: {
  open: boolean
  onClose: () => void
  mode: "create" | "edit" | "assign"
  point: PointOption | null
  vendors: VendorOption[]
}) {
  const isEdit = mode === "edit"
  const isAssign = mode === "assign"

  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [formState, setFormState] = useState({
    name: point?.name ?? "",
    district: point?.district ?? "",
    address: point?.address ?? "",
    phone: point?.phone ?? "",
    brands: point?.brands?.join(", ") ?? "",
    formats: point?.formats?.join(", ") ?? "",
    vendorId: point?.vendorId ?? "__none__",
  })

  if (!open) return null

  const run = async (formData: FormData) => {
    setFeedback(null)
    if (point?.id) formData.set("pointId", point.id)
    let result: ActionResult
    if (isAssign) {
      result = await assignVendorToPoint(null, formData)
    } else if (isEdit) {
      result = await updatePoint(null, formData)
    } else {
      result = await createPoint(null, formData)
    }
    setFeedback(result)
    if (result.ok) onClose()
  }

  const title = isAssign
    ? "Assigner un vendeur"
    : isEdit
    ? "Modifier le point de vente"
    : "Nouveau point de vente"

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {isAssign
              ? `Associe un vendeur à « ${point?.name} » ou retire le rattachement actuel.`
              : isEdit
              ? "Mise à jour des informations du dépôt."
              : "Création d'un nouveau dépôt de gaz."}
          </DialogDescription>
        </DialogHeader>

        {isAssign ? (
          <form action={run} className="space-y-4">
            <input type="hidden" name="pointId" value={point?.id ?? ""} />
            <div className="space-y-1.5">
              <Label htmlFor="assign-vendor">Vendeur</Label>
              <select
                id="assign-vendor"
                name="vendorId"
                value={formState.vendorId}
                onChange={(e) => setFormState((s) => ({ ...s, vendorId: e.target.value }))}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="__none__">Sans vendeur</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            {feedback && (
              <p role="alert" className={cn("text-sm", feedback.ok ? "text-success" : "text-destructive")}>{feedback.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        ) : (
          <form action={run} className="space-y-4">
            {isEdit && <input type="hidden" name="pointId" value={point?.id ?? ""} />}
            <div className="space-y-1.5">
              <Label htmlFor="point-name">Nom du dépôt</Label>
              <Input
                id="point-name"
                name="name"
                value={formState.name}
                onChange={(e) => setFormState((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="point-district">Quartier</Label>
                <Input
                  id="point-district"
                  name="district"
                  value={formState.district}
                  onChange={(e) => setFormState((s) => ({ ...s, district: e.target.value }))}
                  placeholder="Ex: Akwa"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="point-phone">Téléphone</Label>
                <Input
                  id="point-phone"
                  name="phone"
                  type="tel"
                  value={formState.phone}
                  onChange={(e) => setFormState((s) => ({ ...s, phone: e.target.value }))}
                  placeholder="+237 6 99 00 00 00"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="point-address">Adresse / repère</Label>
              <Input
                id="point-address"
                name="address"
                value={formState.address}
                onChange={(e) => setFormState((s) => ({ ...s, address: e.target.value }))}
                placeholder="Ex: Rue 123, proche du marché"
                required
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="point-brands">Marques (séparées par des virgules)</Label>
                <Input
                  id="point-brands"
                  name="brands"
                  value={formState.brands}
                  onChange={(e) => setFormState((s) => ({ ...s, brands: e.target.value }))}
                  placeholder="Ex: Gazex, Payo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="point-formats">Formats (séparés par des virgules)</Label>
                <Input
                  id="point-formats"
                  name="formats"
                  value={formState.formats}
                  onChange={(e) => setFormState((s) => ({ ...s, formats: e.target.value }))}
                  placeholder="Ex: 6 kg, 12,5 kg"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="point-vendor">Vendeur rattaché</Label>
              <select
                id="point-vendor"
                name="vendorId"
                value={formState.vendorId}
                onChange={(e) => setFormState((s) => ({ ...s, vendorId: e.target.value }))}
                className="h-11 w-full rounded-lg border bg-background px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                <option value="__none__">Sans vendeur</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            </div>
            {feedback && (
              <p role="alert" className={cn("text-sm", feedback.ok ? "text-success" : "text-destructive")}>{feedback.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose}>Annuler</Button>
              <Button type="submit">{isEdit ? "Enregistrer" : "Créer le dépôt"}</Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}