"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Check, Plus, Trash2, AlertCircle } from "lucide-react"
import {
  GAS_BOTTLE_FORMATS,
  MAX_VENDOR_FORMATS,
  normalizeCatalogValue,
} from "@/lib/vendor-catalog"

export function FormatListInput({
  values,
  onChange,
  disabled = false,
  error,
  label = "Formats de bouteilles",
  options = GAS_BOTTLE_FORMATS,
}: {
  values: string[]
  onChange: (values: string[]) => void
  disabled?: boolean
  error?: string
  label?: string
  options?: readonly string[]
}) {
  const [customFormat, setCustomFormat] = useState("")
  const [customError, setCustomError] = useState("")

  const knownOptionKeys = useMemo(
    () => new Set(options.map(normalizeCatalogValue)),
    [options]
  )

  const customFormats = useMemo(
    () => values.filter((value) => !knownOptionKeys.has(normalizeCatalogValue(value))),
    [knownOptionKeys, values]
  )

  const allOptions = useMemo(() => {
    const extras = values.filter(
      (value) => value.trim() && !knownOptionKeys.has(normalizeCatalogValue(value))
    )
    return [...options, ...extras]
  }, [knownOptionKeys, options, values])

  const selectedCount = values.length

  const toggleFormat = (value: string) => {
    if (disabled) return
    const selected = values.some(
      (item) => normalizeCatalogValue(item) === normalizeCatalogValue(value)
    )
    if (selected) {
      onChange(values.filter((item) => normalizeCatalogValue(item) !== normalizeCatalogValue(value)))
      return
    }
    if (selectedCount >= MAX_VENDOR_FORMATS) {
      setCustomError(`Vous pouvez sélectionner au maximum ${MAX_VENDOR_FORMATS} formats.`)
      return
    }
    onChange([...values, value])
    setCustomError("")
  }

  const addCustomFormat = () => {
    const value = customFormat.trim()
    if (!value) return
    if (value.length > 30) {
      setCustomError("Chaque format doit faire maximum 30 caractères.")
      return
    }
    if (values.some((item) => normalizeCatalogValue(item) === normalizeCatalogValue(value))) {
      setCustomError("Ce format est déjà sélectionné.")
      return
    }
    if (selectedCount >= MAX_VENDOR_FORMATS) {
      setCustomError(`Vous pouvez sélectionner au maximum ${MAX_VENDOR_FORMATS} formats.`)
      return
    }

    onChange([...values, value])
    setCustomFormat("")
    setCustomError("")
  }

  const removeFormat = (value: string) => {
    if (disabled) return
    onChange(values.filter((item) => normalizeCatalogValue(item) !== normalizeCatalogValue(value)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <Label>{label}</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Sélectionnez tous les grammages proposés par votre point de dépôt.
          </p>
        </div>
        <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {selectedCount} sélectionné{selectedCount > 1 ? "s" : ""}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {allOptions.map((format) => {
          const selected = values.some(
            (item) => normalizeCatalogValue(item) === normalizeCatalogValue(format)
          )
          return (
            <Button
              key={format}
              type="button"
              variant={selected ? "default" : "outline"}
              size="sm"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => toggleFormat(format)}
              className="h-auto min-h-9 justify-start gap-2 px-3 py-2 text-left"
            >
              <span className="min-w-0 flex-1 truncate">{format}</span>
              {selected && <Check className="size-4 shrink-0" aria-hidden />}
            </Button>
          )
        })}
      </div>

      <div className="space-y-2 rounded-lg border border-dashed border-border p-3">
        <Label htmlFor="custom-format">Autre format</Label>
        <div className="flex gap-2">
          <Input
            id="custom-format"
            type="text"
            value={customFormat}
            maxLength={30}
            disabled={disabled}
            placeholder="Ex: 5 kg"
            onChange={(event) => {
              setCustomFormat(event.target.value)
              setCustomError("")
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                addCustomFormat()
              }
            }}
          />
          <Button
            type="button"
            variant="outline"
            disabled={disabled || !customFormat.trim()}
            onClick={addCustomFormat}
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

      {customFormats.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Formats saisis manuellement">
          {customFormats.map((format) => (
            <li key={format}>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={disabled}
                onClick={() => removeFormat(format)}
                className="gap-2"
              >
                {format}
                <Trash2 className="size-3.5" aria-hidden />
                <span className="sr-only">Retirer {format}</span>
              </Button>
            </li>
          ))}
        </ul>
      )}

      {selectedCount === 0 && (
        <p className="text-xs text-muted-foreground">
          Sélectionnez au moins un format pour continuer.
        </p>
      )}

      {error && (
        <p
          id="format-list-error"
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
