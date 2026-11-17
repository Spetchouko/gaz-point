"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Plus, Trash2, AlertCircle } from "lucide-react"
import {
  dedupeBrands,
  brandKey,
  MIN_VENDOR_BRANDS,
  MAX_VENDOR_BRANDS,
} from "@/lib/vendor-brands"
import {
  CAMEROON_GAS_BRANDS,
  normalizeCatalogValue,
} from "@/lib/vendor-catalog"

export function BrandListInput({
  values,
  onChange,
  min = MIN_VENDOR_BRANDS,
  max = MAX_VENDOR_BRANDS,
  disabled = false,
  error,
  label = "Marques de bouteilles",
  hint,
  options = CAMEROON_GAS_BRANDS,
}: {
  values: string[]
  onChange: (values: string[]) => void
  min?: number
  max?: number
  disabled?: boolean
  error?: string
  label?: string
  hint?: string
  options?: readonly string[]
}) {
  const [customBrand, setCustomBrand] = useState("")
  const [customError, setCustomError] = useState("")

  const knownOptionKeys = useMemo(
    () => new Set(options.map(normalizeCatalogValue)),
    [options]
  )

  const customBrands = useMemo(
    () => values.filter((value) => !knownOptionKeys.has(normalizeCatalogValue(value))),
    [knownOptionKeys, values]
  )

  const allOptions = useMemo(() => {
    const extras = values.filter(
      (value) => value.trim() && !knownOptionKeys.has(normalizeCatalogValue(value))
    )
    return [...options, ...extras]
  }, [knownOptionKeys, options, values])

  const selectedCount = dedupeBrands(values).length
  const reached = selectedCount >= min

  const toggleBrand = (value: string) => {
    if (disabled) return
    const isSelected = values.some((item) => brandKey(item) === brandKey(value))
    if (isSelected) {
      onChange(values.filter((item) => brandKey(item) !== brandKey(value)))
      return
    }
    if (selectedCount >= max) {
      setCustomError(`Vous pouvez sélectionner au maximum ${max} marques.`)
      return
    }
    onChange([...values, value])
    setCustomError("")
  }

  const addCustomBrand = () => {
    const value = customBrand.trim()
    if (!value) return
    if (value.length > 50) {
      setCustomError("Chaque marque doit faire maximum 50 caractères.")
      return
    }
    if (values.some((item) => brandKey(item) === brandKey(value))) {
      setCustomError("Cette marque est déjà sélectionnée.")
      return
    }
    if (selectedCount >= max) {
      setCustomError(`Vous pouvez sélectionner au maximum ${max} marques.`)
      return
    }

    onChange([...values, value])
    setCustomBrand("")
    setCustomError("")
  }

  const removeBrand = (value: string) => {
    if (disabled) return
    onChange(values.filter((item) => brandKey(item) !== brandKey(value)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>{label}</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            {hint ??
              "Sélectionnez une ou plusieurs marques commercialisées au Cameroun."}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            reached ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
          }`}
        >
          {selectedCount} sélectionnée{selectedCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto rounded-lg border border-border/70 bg-muted/20 p-3 sm:grid-cols-3">
        {allOptions.map((brand) => {
          const selected = values.some(
            (item) => brandKey(item) === brandKey(brand)
          )
          return (
            <Button
              key={brand}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => toggleBrand(brand)}
              className="h-auto min-h-9 justify-start gap-2 px-3 py-2 text-left"
            >
              <span className="min-w-0 flex-1 truncate">{brand}</span>
              {selected && <Check className="size-4 shrink-0" aria-hidden />}
            </Button>
          )
        })}
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
        <Label htmlFor="custom-brand">Autre marque</Label>
        <div className="flex gap-2">
          <Input
            id="custom-brand"
            type="text"
            value={customBrand}
            maxLength={50}
            disabled={disabled}
            placeholder="Saisissez une marque non listée"
            onChange={(event) => {
              setCustomBrand(event.target.value)
              setCustomError("")
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                addCustomBrand()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !customBrand.trim()}
            onClick={addCustomBrand}
          >
            <Plus className="size-4" /> Ajouter
          </Button>
        </div>
        {customError && (
          <p className="text-xs text-destructive" role="alert">
            {customError}
          </p>
        )}
      </div>

      {customBrands.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Marques saisies manuellement">
          {customBrands.map((brand) => (
            <li key={brand}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => removeBrand(brand)}
                className="gap-2"
              >
                {brand}
                <Trash2 className="size-3.5" aria-hidden />
                <span className="sr-only">Retirer {brand}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {!reached && (
        <p className="text-xs text-muted-foreground">
          Sélectionnez au moins {min} marque{min > 1 ? "s" : ""} pour continuer.
        </p>
      )}

      {error && (
        <p
          id="brand-list-error"
          className="flex items-center gap-1.5 text-sm text-destructive"
          role="alert"
        >
          <AlertCircle className="size-4 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
