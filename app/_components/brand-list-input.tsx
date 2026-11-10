"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Trash2, Cylinder, AlertCircle } from "lucide-react"
import {
  dedupeBrands,
  MIN_VENDOR_BRANDS,
  MAX_VENDOR_BRANDS,
} from "@/lib/vendor-onboarding"

/**
 * Saisie dynamique d'une liste de marques de bouteilles distinctes.
 *
 * - Ajout / suppression de lignes (au minimum `min` marques différentes) ;
 * - Déduplication insensible à la casse à l'envoi (la première graphie est
 *   conservée) ;
 * - Les valeurs contrôlées permettent de reprendre le saisie après un
 *   rechargement de la page.
 */
export function BrandListInput({
  values,
  onChange,
  min = MIN_VENDOR_BRANDS,
  max = MAX_VENDOR_BRANDS,
  disabled = false,
  error,
  label = "Marques de bouteilles",
  hint,
}: {
  values: string[]
  onChange: (values: string[]) => void
  min?: number
  max?: number
  disabled?: boolean
  error?: string
  label?: string
  hint?: string
}) {
  const rows = useMemo(
    () => (values.length > 0 ? values : [""]),
    [values]
  )

  const updateRow = (index: number, value: string) => {
    const next = [...rows]
    next[index] = value
    onChange(next)
  }

  const addRow = () => {
    if (rows.length >= max || disabled) return
    onChange([...rows, ""])
  }

  const removeRow = (index: number) => {
    if (disabled) return
    const next = rows.filter((_, i) => i !== index)
    onChange(next.length > 0 ? next : [""])
  }

  const distinctCount = dedupeBrands(rows).length
  const reached = distinctCount >= min

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <Label htmlFor="brand-row-0">{label}</Label>
          <p className="text-xs text-muted-foreground mt-1">
            {hint ??
              `${min} marques minimum — plusieurs grammages par marque seront possibles à l'étape suivante.`}
          </p>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
            reached ? "bg-success/15 text-success" : "bg-muted text-muted-foreground"
          }`}
        >
          {distinctCount}/{min}
        </span>
      </div>

      <ul className="space-y-2">
        {rows.map((value, index) => {
          const isDuplicate =
            value.trim() &&
            dedupeBrands(rows).filter(
              (brand) => brand.toLowerCase() === value.trim().toLowerCase()
            ).length > 0
          return (
            <li key={index} className="flex items-start gap-2">
              <div className="relative flex-1">
                <Cylinder className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id={`brand-row-${index}`}
                  type="text"
                  autoComplete="off"
                  placeholder={`Marque ${index + 1}`}
                  value={value}
                  onChange={(e) => updateRow(index, e.target.value)}
                  disabled={disabled}
                  className="pl-9 pr-9"
                  aria-label={`Marque ${index + 1}`}
                />
                {value.trim() && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                    {isDuplicate ? "doublon" : "ok"}
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={`Supprimer la marque ${index + 1}`}
                onClick={() => removeRow(index)}
                disabled={disabled}
              >
                <Trash2 className="size-4" />
              </Button>
            </li>
          )
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addRow}
          disabled={disabled || rows.length >= max}
        >
          <Plus className="size-4" /> Ajouter une marque
        </Button>
        {!reached && (
          <span className="text-xs text-muted-foreground">
            Il reste {min - distinctCount} marque{min - distinctCount > 1 ? "s" : ""} à
            renseigner.
          </span>
        )}
      </div>

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
