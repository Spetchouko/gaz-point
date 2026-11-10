"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Package,
  Pencil,
  Plus,
  Store,
  Trash2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import {
  buildInitialInventory,
  dedupeBrands,
  MIN_VENDOR_BRANDS,
  validateInventoryForFinalization,
  validatePointInfo,
  type VendorInventoryEntry,
} from "@/lib/vendor-onboarding"
import {
  finalizeVendorPoint,
  saveVendorInventoryDraft,
  saveVendorPointInfo,
} from "@/app/dashboard/vendeur/onboarding-actions"

type PointState = {
  pointName: string
  district: string
  address: string
  phone: string
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorName: string
  initial: {
    pointName: string
    district: string
    address: string
    phone: string | null
    brands: string[]
    inventory: VendorInventoryEntry[]
  }
}

const STEPS = [
  { key: 1, label: "Informations du dépôt", icon: Store },
  { key: 2, label: "Inventaire", icon: Package },
  { key: 3, label: "Finalisation", icon: CheckCircle2 },
] as const

function toInventoryJson(rows: VendorInventoryEntry[]): string {
  return JSON.stringify(
    rows.map((row) => ({
      brand: row.brand,
      format: row.format,
      quantity: String(row.quantity ?? ""),
    }))
  )
}

export function VendorPointOnboardingModal({
  open,
  onOpenChange,
  vendorName,
  initial,
}: Props) {
  const router = useRouter()

  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [point, setPoint] = useState<PointState>({
    pointName: initial.pointName,
    district: initial.district,
    address: initial.address,
    phone: initial.phone ?? "",
  })
  const [rows, setRows] = useState<VendorInventoryEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [pending, setPending] = useState<null | "point" | "draft" | "finalize">(null)
  const [done, setDone] = useState(false)

  // Réinitialise la modale à chaque ouverture (transition fermé → ouvert) pour
  // reprendre l'état serveur : brouillon déjà enregistré après un rechargement
  // ou une interruption. Un rafraîchissement pendant la saisie (ex: après la
  // finalisation) ne réinitialise donc pas l'état affiché.
  const wasOpenRef = useRef(false)
  useEffect(() => {
    if (open && !wasOpenRef.current) {
      setStep(1)
      setDone(false)
      setError(null)
      setFieldErrors({})
      setPending(null)
      setPoint({
        pointName: initial.pointName,
        district: initial.district,
        address: initial.address,
        phone: initial.phone ?? "",
      })
      setRows(buildInitialInventory(initial.brands, initial.inventory))
    }
    wasOpenRef.current = open
  }, [open, initial])

  const distinctBrands = useMemo(
    () => dedupeBrands(rows.map((row) => row.brand)).length,
    [rows]
  )

  const filledRows = rows.filter(
    (row) => row.brand.trim() || row.format.trim() || String(row.quantity).trim()
  )

  const updateRow = (index: number, patch: Partial<VendorInventoryEntry>) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
  }

  const addRow = () => {
    if (rows.length >= 200) return
    setRows((prev) => [...prev, { brand: "", format: "", quantity: "" }])
  }

  const removeRow = (index: number) => {
    setRows((prev) => prev.filter((_, i) => i !== index))
  }

  const submitPointInfo = async () => {
    setError(null)
    const errors: Record<string, string> = {}
    try {
      validatePointInfo(point)
    } catch (err) {
      errors.point = err instanceof Error ? err.message : "Informations invalides."
    }
    if (errors.point) {
      setFieldErrors(errors)
      setError(errors.point)
      return
    }
    setFieldErrors({})
    setPending("point")
    try {
      const formData = new FormData()
      formData.set("pointName", point.pointName)
      formData.set("district", point.district)
      formData.set("address", point.address)
      formData.set("phone", point.phone)
      const result = await saveVendorPointInfo(null, formData)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setStep(2)
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setPending(null)
    }
  }

  const submitInventoryDraft = async (next: boolean) => {
    setError(null)
    if (next) {
      try {
        validateInventoryForFinalization(rows)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Inventaire incomplet."
        setError(message)
        setFieldErrors({ inventory: message })
        return
      }
    }
    setFieldErrors({})
    setPending("draft")
    try {
      const formData = new FormData()
      formData.set("inventory", toInventoryJson(rows))
      const result = await saveVendorInventoryDraft(null, formData)
      if (!result.ok) {
        setError(result.message)
        return
      }
      if (next) setStep(3)
      else toast.success("Brouillon d'inventaire enregistré.")
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setPending(null)
    }
  }

  const submitFinalization = async () => {
    setError(null)
    setPending("finalize")
    try {
      const formData = new FormData()
      formData.set("pointName", point.pointName)
      formData.set("district", point.district)
      formData.set("address", point.address)
      formData.set("phone", point.phone)
      formData.set("inventory", toInventoryJson(rows))
      const result = await finalizeVendorPoint(null, formData)
      if (!result.ok) {
        setError(result.message)
        return
      }
      setDone(true)
      router.refresh()
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setPending(null)
    }
  }

  const busy = pending !== null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl w-[calc(100%-1.5rem)] max-h-[calc(100dvh-2rem)] p-0 gap-0 overflow-hidden">
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <DialogHeader className="shrink-0 border-b border-border px-4 py-4 sm:px-6">
            <DialogTitle className="text-base sm:text-lg">
              {done ? "Point de vente créé" : "Compléter mon point de vente"}
            </DialogTitle>
            <DialogDescription>
              {done
                ? "Votre point de vente est enregistré et vos bouteilles sont prêtes."
                : `Bonjour ${vendorName || "vendeur"}, finalisez les informations de votre dépôt.`}
            </DialogDescription>
          </DialogHeader>

          {!done && (
            <ol
              className="flex shrink-0 items-center gap-1 border-b border-border bg-muted/30 px-4 py-3 sm:px-6"
              aria-label="Progression"
            >
              {STEPS.map((item) => {
                const isDone = step > item.key
                const isCurrent = step === item.key
                const Icon = item.icon
                return (
                  <li key={item.key} className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className={cn(
                        "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                        isDone && "border-success bg-success text-success-foreground",
                        isCurrent && "border-primary bg-primary text-primary-foreground",
                        !isDone && !isCurrent && "border-border bg-background text-muted-foreground"
                      )}
                      aria-current={isCurrent ? "step" : undefined}
                    >
                      {isDone ? <Check className="size-3.5" /> : isCurrent ? <Icon className="size-3.5" /> : item.key}
                    </span>
                    <span
                      className={cn(
                        "hidden truncate text-xs sm:block",
                        isCurrent ? "font-semibold text-foreground" : "text-muted-foreground"
                      )}
                    >
                      {item.label}
                    </span>
                    {item.key < 3 && (
                      <span className="h-px flex-1 bg-border" aria-hidden />
                    )}
                  </li>
                )
              })}
            </ol>
          )}

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6">
            {error && (
              <div
                className="mb-4 flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
              >
                <span>{error}</span>
              </div>
            )}

            {done ? (
              <div className="flex flex-col items-center justify-center gap-3 py-8 text-center">
                <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
                  <CheckCircle2 className="size-7" />
                </span>
                <p className="text-base font-semibold">Point de vente finalisé !</p>
                <p className="max-w-md text-sm text-muted-foreground">
                  Vous pouvez maintenant gérer vos bouteilles et publier vos
                  disponibilités depuis votre tableau de bord.
                </p>
              </div>
            ) : step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="ob-pointName">Nom du point de vente</Label>
                  <Input
                    id="ob-pointName"
                    value={point.pointName}
                    onChange={(e) =>
                      setPoint((p) => ({ ...p, pointName: e.target.value }))
                    }
                    placeholder="Ex: Point Gaz Bonamoussadi"
                    disabled={busy}
                    required
                  />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ob-district">Quartier</Label>
                    <Input
                      id="ob-district"
                      value={point.district}
                      onChange={(e) =>
                        setPoint((p) => ({ ...p, district: e.target.value }))
                      }
                      placeholder="Ex: Bonamoussadi"
                      disabled={busy}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ob-phone">Téléphone (optionnel)</Label>
                    <Input
                      id="ob-phone"
                      value={point.phone}
                      onChange={(e) =>
                        setPoint((p) => ({ ...p, phone: e.target.value }))
                      }
                      placeholder="Ex: 690123456"
                      inputMode="tel"
                      disabled={busy}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ob-address">Adresse (rue et repères)</Label>
                  <Textarea
                    id="ob-address"
                    value={point.address}
                    onChange={(e) =>
                      setPoint((p) => ({ ...p, address: e.target.value }))
                    }
                    placeholder="Ex: Rue principale, en face de la pharmacie du carrefour"
                    rows={3}
                    disabled={busy}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Précisez la rue et des repères faciles à trouver.
                  </p>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">
                      Références de bouteilles de votre dépôt
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Une marque peut avoir plusieurs grammages. Indiquez la
                      quantité réellement présente.
                    </p>
                  </div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs font-medium",
                      distinctBrands >= MIN_VENDOR_BRANDS
                        ? "bg-success/15 text-success"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {distinctBrands} marque{distinctBrands > 1 ? "s" : ""} distincte
                    {distinctBrands > 1 ? "s" : ""}
                  </span>
                </div>

                <div className="space-y-3">
                  {rows.length === 0 && (
                    <p className="rounded-md border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      Aucune référence. Ajoutez votre première bouteille.
                    </p>
                  )}
                  {rows.map((row, index) => {
                    const incomplete =
                      !row.brand.trim() || !row.format.trim() || String(row.quantity).trim() === ""
                    return (
                      <div
                        key={index}
                        className="rounded-lg border border-border bg-background p-3"
                      >
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            Référence {index + 1}
                            {incomplete && (
                              <span className="ml-2 text-warning">incomplète</span>
                            )}
                          </span>
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Modifier la référence ${index + 1}`}
                              disabled={busy}
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Supprimer la référence ${index + 1}`}
                              onClick={() => removeRow(index)}
                              disabled={busy}
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="grid gap-3 sm:grid-cols-[1.2fr_1fr_0.8fr]">
                          <div className="space-y-1">
                            <Label htmlFor={`ob-brand-${index}`} className="text-xs">
                              Marque
                            </Label>
                            <Input
                              id={`ob-brand-${index}`}
                              list="ob-brand-suggestions"
                              value={row.brand}
                              onChange={(e) => updateRow(index, { brand: e.target.value })}
                              placeholder="Ex: Total"
                              disabled={busy}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`ob-format-${index}`} className="text-xs">
                              Grammage
                            </Label>
                            <Input
                              id={`ob-format-${index}`}
                              value={row.format}
                              onChange={(e) => updateRow(index, { format: e.target.value })}
                              placeholder="Ex: 12,5 kg"
                              disabled={busy}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor={`ob-qty-${index}`} className="text-xs">
                              Quantité
                            </Label>
                            <Input
                              id={`ob-qty-${index}`}
                              type="number"
                              inputMode="numeric"
                              min={0}
                              step={1}
                              value={String(row.quantity ?? "")}
                              onChange={(e) => updateRow(index, { quantity: e.target.value })}
                              placeholder="0"
                              disabled={busy}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <datalist id="ob-brand-suggestions">
                  {initial.brands.map((brand) => (
                    <option key={brand} value={brand} />
                  ))}
                </datalist>

                <Button type="button" variant="outline" size="sm" onClick={addRow} disabled={busy}>
                  <Plus className="size-4" /> Ajouter une référence
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
                    <Store className="size-4 text-primary" /> {point.pointName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {point.district} — {point.address}
                  </p>
                  {point.phone && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      Téléphone : {point.phone}
                    </p>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold">
                    Inventaire ({filledRows.length} référence
                    {filledRows.length > 1 ? "s" : ""}, {distinctBrands} marque
                    {distinctBrands > 1 ? "s" : ""} distincte
                    {distinctBrands > 1 ? "s" : ""})
                  </p>
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
                    <table className="w-full text-sm">
                      <thead className="sticky top-0 bg-muted text-left text-xs uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="px-3 py-2">Marque</th>
                          <th className="px-3 py-2">Grammage</th>
                          <th className="px-3 py-2 text-right">Quantité</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filledRows.map((row, index) => (
                          <tr key={index} className="border-t border-border">
                            <td className="px-3 py-2 font-medium">{row.brand}</td>
                            <td className="px-3 py-2">{row.format}</td>
                            <td className="px-3 py-2 text-right font-mono">
                              {String(row.quantity)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Le point de vente sera créé ou mis à jour automatiquement :
                    aucune donnée ne sera dupliquée.
                  </p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="shrink-0 flex-col gap-2 border-t border-border px-4 py-4 sm:flex-row sm:justify-between sm:px-6">
            {done ? (
              <Button
                type="button"
                className="w-full"
                onClick={() => onOpenChange(false)}
              >
                Fermer
              </Button>
            ) : (
              <>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => (step === 1 ? onOpenChange(false) : setStep((s) => (s - 1) as 1 | 2 | 3))}
                    disabled={busy}
                  >
                    <ArrowLeft className="size-4" />
                    {step === 1 ? "Fermer" : "Retour"}
                  </Button>
                  {step === 2 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => submitInventoryDraft(false)}
                      disabled={busy}
                    >
                      {pending === "draft" ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : (
                        "Enregistrer le brouillon"
                      )}
                    </Button>
                  )}
                </div>

                {step === 1 && (
                  <Button
                    type="button"
                    onClick={submitPointInfo}
                    disabled={busy}
                  >
                    Continuer
                    {pending === "point" ? (
                      <Loader2 className="ml-2 size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="ml-2 size-4" />
                    )}
                  </Button>
                )}
                {step === 2 && (
                  <Button
                    type="button"
                    onClick={() => submitInventoryDraft(true)}
                    disabled={busy}
                  >
                    Continuer
                    {pending === "draft" ? (
                      <Loader2 className="ml-2 size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="ml-2 size-4" />
                    )}
                  </Button>
                )}
                {step === 3 && (
                  <Button
                    type="button"
                    onClick={submitFinalization}
                    disabled={busy}
                  >
                    <CheckCircle2 className="size-4" />
                    Finaliser mon point de vente
                    {pending === "finalize" && (
                      <Loader2 className="ml-2 size-4 animate-spin" />
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  )
}
