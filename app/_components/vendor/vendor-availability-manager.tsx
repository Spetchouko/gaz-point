"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Package, Pencil, Plus, Power } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  VendorEmptyState,
  VendorErrorState,
  VendorPageHeader,
  VendorSectionCard,
  VendorStatusBadge,
} from "@/app/_components/vendor/vendor-ui"
import { formatDateTime, formatPrice } from "@/lib/gaz"
import type {
  VendorAvailabilityDto,
  VendorDepotDto,
} from "@/lib/vendor-dashboard"

type ActionError = { message: string; retry: () => void }

function toDateTimeLocal(value: string | null): string {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""
  return date.toISOString().slice(0, 16)
}

export function VendorAvailabilityManager({
  depot,
  availabilities: initialAvailabilities,
}: {
  depot: VendorDepotDto | null
  availabilities: VendorAvailabilityDto[]
}) {
  const router = useRouter()
  const formRef = useRef<HTMLFormElement | null>(null)
  const editFormRef = useRef<HTMLFormElement | null>(null)
  const [items, setItems] = useState(initialAvailabilities)
  const [brand, setBrand] = useState(depot?.brands[0] ?? "")
  const [format, setFormat] = useState(depot?.formats[0] ?? "")
  const [quantity, setQuantity] = useState("1")
  const [price, setPrice] = useState("")
  const [note, setNote] = useState("")
  const [status, setStatus] = useState<"disponible" | "indisponible">("disponible")
  const [savingAdd, setSavingAdd] = useState(false)
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set())
  const [editing, setEditing] = useState<VendorAvailabilityDto | null>(null)
  const [editQuantity, setEditQuantity] = useState("")
  const [editPrice, setEditPrice] = useState("")
  const [editNote, setEditNote] = useState("")
  const [editPhone, setEditPhone] = useState("")
  const [editExpiresAt, setEditExpiresAt] = useState("")
  const [editStatus, setEditStatus] = useState<"disponible" | "indisponible">("disponible")
  const [editBrand, setEditBrand] = useState("")
  const [editFormat, setEditFormat] = useState("")
  const [error, setError] = useState<ActionError | null>(null)

  // Après router.refresh(), les props serveur sont la source de vérité. On
  // synchronise pendant le rendu (motif React recommandé) plutôt que dans un
  // effet, afin d'éviter un rendu en cascade.
  const [syncedAvailabilities, setSyncedAvailabilities] = useState(initialAvailabilities)
  if (syncedAvailabilities !== initialAvailabilities) {
    setSyncedAvailabilities(initialAvailabilities)
    setItems(initialAvailabilities)
  }

  if (!brand && depot?.brands[0]) setBrand(depot.brands[0])
  if (!format && depot?.formats[0]) setFormat(depot.formats[0])

  const runAction = async (
    action: () => Promise<void>,
    successMessage: string
  ): Promise<boolean> => {
    setError(null)
    try {
      await action()
      toast.success(successMessage)
      router.refresh()
      return true
    } catch (actionError) {
      const message =
        actionError instanceof Error
          ? actionError.message
          : "Une erreur est survenue. Réessayez."
      setError({ message, retry: () => void runAction(action, successMessage) })
      return false
    }
  }

  const readErrorMessage = async (response: Response, fallback: string) => {
    const payload = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    if (!response.ok) throw new Error(payload?.error ?? fallback)
  }

  const handleAdd = (event: React.FormEvent) => {
    event.preventDefault()
    if (!depot) return
    if (!brand || !format) {
      setError({
        message: "Sélectionnez une marque et un grammage déclarés pour votre dépôt.",
        retry: () => formRef.current?.requestSubmit(),
      })
      return
    }
    const parsedQuantity = Number(quantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1) {
      setError({
        message: "Indiquez une quantité entière supérieure à zéro.",
        retry: () => formRef.current?.requestSubmit(),
      })
      return
    }

    const body = {
      pointId: depot.id,
      brand,
      format,
      status,
      quantity: parsedQuantity,
      price: price ? Number(price) : null,
      note: note.trim() || null,
    }

    void (async () => {
      setSavingAdd(true)
      const ok = await runAction(async () => {
        const response = await fetch("/api/disponibilite/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        await readErrorMessage(response, "Impossible d'enregistrer la disponibilité")
      }, "Disponibilité enregistrée")
      if (ok) {
        setQuantity("1")
        setPrice("")
        setNote("")
      }
      setSavingAdd(false)
    })()
  }

  const openEditor = (item: VendorAvailabilityDto) => {
    setEditing(item)
    setEditQuantity(item.quantity != null ? String(item.quantity) : "")
    setEditPrice(item.price != null ? String(item.price) : "")
    setEditNote(item.note ?? "")
    setEditPhone(item.phone ?? "")
    setEditExpiresAt(toDateTimeLocal(item.expiresAt))
    setEditStatus(item.status === "disponible" ? "disponible" : "indisponible")
    setEditBrand(item.brand ?? "")
    setEditFormat(item.format ?? "")
    setError(null)
  }

  const handleEdit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!editing) return
    const parsedQuantity = editQuantity ? Number(editQuantity) : null
    const parsedPrice = editPrice ? Number(editPrice) : null
    if (
      (editQuantity && (!Number.isInteger(parsedQuantity) || (parsedQuantity ?? -1) < 0)) ||
      (editPrice && (!Number.isInteger(parsedPrice) || (parsedPrice ?? -1) < 0))
    ) {
      setError({
        message: "La quantité et le prix doivent être des nombres entiers positifs.",
        retry: () => editFormRef.current?.requestSubmit(),
      })
      return
    }

    void (async () => {
      const ok = await runAction(async () => {
        const response = await fetch(`/api/disponibilite/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: editStatus,
            quantity: parsedQuantity,
            price: parsedPrice,
            note: editNote.trim() || null,
            phone: editPhone.trim() || null,
            expiresAt: editExpiresAt ? new Date(editExpiresAt).toISOString() : null,
            brand: editBrand || null,
            format: editFormat || null,
          }),
        })
        await readErrorMessage(response, "Impossible de modifier la disponibilité")
      }, "Disponibilité mise à jour")
      if (ok) setEditing(null)
    })()
  }

  const toggleStatus = async (item: VendorAvailabilityDto) => {
    const nextStatus = item.effectiveStatus === "disponible" ? "indisponible" : "disponible"
    setBusyIds((current) => new Set(current).add(item.id))
    const ok = await runAction(async () => {
      const response = await fetch(`/api/disponibilite/${item.id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      })
      await readErrorMessage(response, "Impossible de changer le statut")
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                status: nextStatus,
                effectiveStatus: nextStatus,
              }
            : entry
        )
      )
    }, nextStatus === "disponible" ? "Disponibilité publiée" : "Disponibilité masquée")
    if (!ok) {
      setItems(initialAvailabilities)
    }
    setBusyIds((current) => {
      const next = new Set(current)
      next.delete(item.id)
      return next
    })
  }

  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Mes disponibilités"
        description={
          depot
            ? `Dépôt associé : ${depot.name} · ${depot.district}`
            : "Créez d'abord votre point de vente pour publier vos stocks."
        }
        actions={
          <Button
            variant="outline"
            size="sm"
            render={<Link href="/dashboard/depot">Gérer mon dépôt</Link>}
          />
        }
      />

      {error && (
        <VendorErrorState message={error.message} onRetry={error.retry} />
      )}

      {!depot ? (
        <VendorSectionCard title="Aucun dépôt configuré">
          <VendorEmptyState
            icon={Package}
            title="Aucune disponibilité possible"
            description="Vous devez créer votre point de vente avant de renseigner vos disponibilités."
            actions={
              <Button
                size="sm"
                render={<Link href="/dashboard/depot">Créer mon dépôt</Link>}
              />
            }
          />
        </VendorSectionCard>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[340px_1fr] lg:items-start">
          <VendorSectionCard
            title="Ajouter une disponibilité"
            description="Les marques et grammages sont ceux de votre dépôt."
          >
            <form ref={formRef} onSubmit={handleAdd} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="space-y-1.5">
                  <Label htmlFor="dispo-brand">Marque</Label>
                  <Select value={brand} onValueChange={(value) => setBrand(value ?? "")}>
                    <SelectTrigger id="dispo-brand" className="w-full">
                      <SelectValue placeholder="Choisir une marque" />
                    </SelectTrigger>
                    <SelectContent>
                      {depot.brands.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dispo-format">Grammage</Label>
                  <Select value={format} onValueChange={(value) => setFormat(value ?? "")}>
                    <SelectTrigger id="dispo-format" className="w-full">
                      <SelectValue placeholder="Choisir un grammage" />
                    </SelectTrigger>
                    <SelectContent>
                      {depot.formats.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="dispo-quantity">Quantité</Label>
                  <Input
                    id="dispo-quantity"
                    type="number"
                    min={1}
                    step={1}
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    disabled={savingAdd}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="dispo-price">Prix (FCFA)</Label>
                  <Input
                    id="dispo-price"
                    type="number"
                    min={0}
                    step={1}
                    value={price}
                    onChange={(event) => setPrice(event.target.value)}
                    placeholder="Facultatif"
                    disabled={savingAdd}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dispo-note">Note</Label>
                <Textarea
                  id="dispo-note"
                  rows={2}
                  maxLength={500}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Facultatif"
                  disabled={savingAdd}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                <Label htmlFor="dispo-status" className="text-xs">
                  Publier immédiatement
                </Label>
                <Switch
                  id="dispo-status"
                  checked={status === "disponible"}
                  onCheckedChange={(checked) =>
                    setStatus(checked ? "disponible" : "indisponible")
                  }
                  disabled={savingAdd}
                />
              </div>

              <Button type="submit" size="sm" className="w-full" disabled={savingAdd || !brand || !format}>
                <Plus className="size-4" aria-hidden />
                {savingAdd ? "Enregistrement…" : "Ajouter la disponibilité"}
              </Button>
            </form>
          </VendorSectionCard>

          <VendorSectionCard
            title="Disponibilités enregistrées"
            description={`${items.length} référence${items.length > 1 ? "s" : ""} pour ${depot.name}`}
            contentClassName="p-0"
          >
            {items.length === 0 ? (
              <VendorEmptyState
                icon={Package}
                title="Aucune disponibilité"
                description="Ajoutez votre première référence avec le formulaire à gauche."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2.5 font-medium">Référence</th>
                      <th className="px-4 py-2.5 font-medium">Stock</th>
                      <th className="px-4 py-2.5 font-medium">Prix</th>
                      <th className="px-4 py-2.5 font-medium">Statut</th>
                      <th className="px-4 py-2.5 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/70">
                    {items.map((item) => (
                      <tr key={item.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {item.brand ?? "Marque inconnue"} · {item.format ?? "Format inconnu"}
                          </p>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            {item.pointName ?? depot.name} · maj {formatDateTime(item.updatedAt)}
                          </p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="tabular-nums text-foreground">
                            {item.availableQuantity ?? "—"}
                            {item.availableQuantity != null && (
                              <span className="text-muted-foreground"> / {item.quantity ?? "—"}</span>
                            )}
                          </p>
                          {item.reservedQuantity > 0 && (
                            <p className="text-xs text-muted-foreground">
                              {item.reservedQuantity} réservée(s)
                            </p>
                          )}
                        </td>
                        <td className="px-4 py-3 tabular-nums text-foreground">
                          {item.price != null ? formatPrice(item.price) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          <VendorStatusBadge
                            status={item.effectiveStatus}
                            label={
                              item.effectiveStatus === "disponible"
                                ? "Disponible"
                                : item.status !== "disponible" && item.status !== "indisponible"
                                  ? "À confirmer"
                                  : "Indisponible"
                            }
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label="Modifier la disponibilité"
                              onClick={() => openEditor(item)}
                            >
                              <Pencil className="size-4" aria-hidden />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={
                                item.effectiveStatus === "disponible"
                                  ? "Masquer la disponibilité"
                                  : "Publier la disponibilité"
                              }
                              disabled={busyIds.has(item.id)}
                              onClick={() => void toggleStatus(item)}
                            >
                              <Power className="size-4" aria-hidden />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </VendorSectionCard>
        </div>
      )}

      <Dialog open={Boolean(editing)} onOpenChange={(open) => !open && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Modifier la disponibilité</DialogTitle>
          </DialogHeader>
          <form ref={editFormRef} onSubmit={handleEdit} className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dispo-brand">Marque</Label>
                <Select value={editBrand} onValueChange={(value) => setEditBrand(value ?? "")}>
                  <SelectTrigger id="edit-dispo-brand" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {depot?.brands.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-dispo-format">Grammage</Label>
                <Select value={editFormat} onValueChange={(value) => setEditFormat(value ?? "")}>
                  <SelectTrigger id="edit-dispo-format" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {depot?.formats.map((item) => (
                      <SelectItem key={item} value={item}>
                        {item}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dispo-quantity">Quantité</Label>
                <Input
                  id="edit-dispo-quantity"
                  type="number"
                  min={0}
                  step={1}
                  value={editQuantity}
                  onChange={(event) => setEditQuantity(event.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-dispo-price">Prix (FCFA)</Label>
                <Input
                  id="edit-dispo-price"
                  type="number"
                  min={0}
                  step={1}
                  value={editPrice}
                  onChange={(event) => setEditPrice(event.target.value)}
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="edit-dispo-phone">Téléphone</Label>
                <Input
                  id="edit-dispo-phone"
                  type="tel"
                  value={editPhone}
                  onChange={(event) => setEditPhone(event.target.value)}
                  maxLength={30}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit-dispo-expires">Expiration</Label>
                <Input
                  id="edit-dispo-expires"
                  type="datetime-local"
                  value={editExpiresAt}
                  onChange={(event) => setEditExpiresAt(event.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit-dispo-note">Note</Label>
              <Textarea
                id="edit-dispo-note"
                rows={2}
                maxLength={500}
                value={editNote}
                onChange={(event) => setEditNote(event.target.value)}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <Label htmlFor="edit-dispo-status" className="text-xs">Disponible</Label>
              <Switch
                id="edit-dispo-status"
                checked={editStatus === "disponible"}
                onCheckedChange={(checked) =>
                  setEditStatus(checked ? "disponible" : "indisponible")
                }
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setEditing(null)}
              >
                Annuler
              </Button>
              <Button type="submit">
                Enregistrer les modifications
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
