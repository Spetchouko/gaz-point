"use client"

import { useMemo, useState } from "react"
import { AlertCircle, CheckCircle2, Loader2, PackageCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { normalizeCatalogValue } from "@/lib/vendor-catalog"

export interface AvailabilityCombination {
  brand: string
  format: string
}

function combinationKey(brand: string, format: string) {
  return `${normalizeCatalogValue(brand)}::${normalizeCatalogValue(format)}`
}

export function VendorAvailabilityForm({
  pointId,
  brands,
  formats,
  existingCombinations = [],
  existingQuantities = {},
  onSaved,
}: {
  pointId: string
  brands: string[]
  formats: string[]
  existingCombinations?: string[]
  existingQuantities?: Record<string, number>
  onSaved?: () => void | Promise<void>
}) {
  const combinations = useMemo(
    () =>
      brands.flatMap((brand) =>
        formats.map((format) => ({ brand, format }))
      ),
    [brands, formats]
  )

  const [enabled, setEnabled] = useState<Set<string>>(
    () => new Set(existingCombinations)
  )
  const [quantities, setQuantities] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {}
    for (const [key, quantity] of Object.entries(existingQuantities)) {
      initial[key] = String(quantity)
    }
    return initial
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const toggleCombination = (key: string) => {
    setEnabled((current) => {
      const next = new Set(current)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
    setError("")
    setSuccess("")
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    setSuccess("")

    const selected = combinations.filter((item) =>
      enabled.has(combinationKey(item.brand, item.format))
    )

    if (selected.length === 0) {
      setError("Sélectionnez au moins une combinaison marque et grammage.")
      return
    }

    for (const item of selected) {
      const key = combinationKey(item.brand, item.format)
      const quantity = Number(quantities[key])
      if (!Number.isInteger(quantity) || quantity < 1) {
        setError(
          `Indiquez une quantité valide pour ${item.brand} ${item.format}.`
        )
        return
      }
    }

    setSaving(true)
    try {
      for (const item of selected) {
        const key = combinationKey(item.brand, item.format)
        const response = await fetch("/api/disponibilite/mine", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pointId,
            brand: item.brand,
            format: item.format,
            status: "disponible",
            quantity: Number(quantities[key]),
          }),
        })

        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null

        if (!response.ok) {
          throw new Error(
            payload?.error ??
              `Impossible d'enregistrer la disponibilité ${item.brand} ${item.format}.`
          )
        }
      }

      setSuccess(
        `${selected.length} disponibilité${selected.length > 1 ? "s" : ""} enregistrée${selected.length > 1 ? "s" : ""}.`
      )
      await onSaved?.()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Impossible d'enregistrer les disponibilités."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/20 shadow-sm">
      <CardHeader>
        <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <PackageCheck className="size-5" aria-hidden />
        </div>
        <CardTitle>Renseigner vos disponibilités</CardTitle>
        <CardDescription>
          Cochez uniquement les combinaisons réellement présentes dans votre dépôt.
          Rien ne sera publié avant votre validation.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            {combinations.map((item) => {
              const key = combinationKey(item.brand, item.format)
              const selected = enabled.has(key)
              return (
                <div
                  key={key}
                  className="flex flex-col gap-3 rounded-lg border border-border bg-background p-3 sm:flex-row sm:items-center"
                >
                  <label className="flex min-w-0 flex-1 items-center gap-3 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={selected}
                      disabled={saving}
                      onChange={() => toggleCombination(key)}
                      className="size-4 shrink-0 accent-primary"
                    />
                    <span className="truncate">
                      {item.brand} · {item.format}
                    </span>
                  </label>
                  <div className="flex items-center gap-2 sm:w-44">
                    <Label
                      htmlFor={`quantity-${key}`}
                      className="whitespace-nowrap text-xs text-muted-foreground"
                    >
                      Quantité
                    </Label>
                    <Input
                      id={`quantity-${key}`}
                      type="number"
                      min={1}
                      step={1}
                      inputMode="numeric"
                      disabled={!selected || saving}
                      value={quantities[key] ?? ""}
                      onChange={(event) => {
                        setQuantities((current) => ({
                          ...current,
                          [key]: event.target.value,
                        }))
                        setError("")
                      }}
                      placeholder="0"
                      className="h-9"
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {error && (
            <div
              className="flex items-center gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
            >
              <AlertCircle className="size-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div
              className="flex items-center gap-2 rounded-md bg-success/10 p-3 text-sm text-success"
              role="status"
            >
              <CheckCircle2 className="size-4 shrink-0" />
              {success}
            </div>
          )}

          <Button type="submit" disabled={saving || combinations.length === 0}>
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" /> Enregistrement…
              </>
            ) : (
              "Valider les disponibilités"
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
