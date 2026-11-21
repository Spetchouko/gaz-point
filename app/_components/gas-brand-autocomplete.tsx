"use client"

import { useEffect, useId, useMemo, useRef, useState } from "react"
import { Check, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  ALL_BRANDS_LABEL,
  exactOfficialBrand,
  normalizeGasBrandKey,
  suggestGasBrands,
} from "@/lib/gas-brands"

type BrandOption = {
  value: string
  label: string
  isAll: boolean
}

export type GasBrandAutocompleteProps = {
  /** Identifiant du champ, pour le label associé. */
  id?: string
  /** Marque officielle sélectionnée, ou chaîne vide pour « Toutes les marques ». */
  value: string
  /** Appelée uniquement avec une marque officielle ou une chaîne vide. */
  onValueChange: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
}

/**
 * Champ de recherche de marque avec autocomplétion.
 *
 * Les suggestions n'apparaissent qu'après une première lettre et ne contiennent
 * que les marques commençant par la saisie. Une saisie libre non reconnue n'est
 * jamais transmise comme marque sélectionnée.
 */
export function GasBrandAutocomplete({
  id,
  value,
  onValueChange,
  placeholder = "Saisissez une marque, ex : Tradex",
  className,
  disabled = false,
}: GasBrandAutocompleteProps) {
  const generatedId = useId()
  const inputId = id ?? `gas-brand-${generatedId}`
  const listboxId = `gas-brand-list-${generatedId}`
  const containerRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState(value ?? "")
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [lastEmitted, setLastEmitted] = useState(value)
  const [previousValue, setPreviousValue] = useState(value)

  // Synchronise l'affichage uniquement quand la marque est fixée depuis
  // l'URL ou un reset, sans écraser une saisie en cours.
  if (previousValue !== value) {
    setPreviousValue(value)
    if (lastEmitted !== value) {
      setQuery(value ?? "")
    }
    setLastEmitted(value)
  }

  const hasQuery = normalizeGasBrandKey(query).length > 0

  const options = useMemo<BrandOption[]>(() => {
    const list: BrandOption[] = []
    if (!hasQuery) {
      list.push({ value: "", label: ALL_BRANDS_LABEL, isAll: true })
    }
    for (const brand of suggestGasBrands(query)) {
      list.push({ value: brand, label: brand, isAll: false })
    }
    return list
  }, [hasQuery, query])

  // Fermeture au clic extérieur, sans conserver une saisie non reconnue.
  useEffect(() => {
    if (!open) return
    const handlePointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setActiveIndex(-1)
        setQuery(value ?? "")
      }
    }
    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [open, value])

  const emit = (nextValue: string) => {
    setLastEmitted(nextValue)
    onValueChange(nextValue)
  }

  const commit = (nextValue: string) => {
    emit(nextValue)
    setQuery(nextValue)
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleChange = (text: string) => {
    setQuery(text)
    setOpen(true)
    setActiveIndex(-1)
    // Seule une marque officielle exactement saisie est transmise au moteur.
    emit(exactOfficialBrand(text) ?? "")
  }

  const handleBlur = () => {
    const exact = exactOfficialBrand(query)
    if (exact) {
      setQuery(exact)
      emit(exact)
    } else if (!normalizeGasBrandKey(query)) {
      setQuery(value ?? "")
    } else if (!value) {
      // Saisie non reconnue : on n'en fait pas une marque sélectionnée.
      setQuery("")
    } else {
      setQuery(value)
    }
    setOpen(false)
    setActiveIndex(-1)
  }

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape") {
      setOpen(false)
      setActiveIndex(-1)
      setQuery(value ?? "")
      return
    }

    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      if (options.length === 0) return
      const delta = event.key === "ArrowDown" ? 1 : -1
      setActiveIndex((current) => {
        if (current === -1) return delta > 0 ? 0 : options.length - 1
        return (current + delta + options.length) % options.length
      })
      return
    }

    if (event.key === "Enter" && open && options.length > 0) {
      event.preventDefault()
      const chosen =
        activeIndex >= 0
          ? options[activeIndex]
          : options.length === 1
            ? options[0]
            : null
      if (chosen) {
        commit(chosen.value)
      } else {
        setActiveIndex(0)
      }
    }
  }

  return (
    <div ref={containerRef} className="relative min-w-0">
      <div className="relative">
        <Input
          id={inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={
            activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined
          }
          autoComplete="off"
          disabled={disabled}
          value={query}
          placeholder={placeholder}
          onChange={(event) => handleChange(event.target.value)}
          onFocus={() => setOpen(true)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className={cn("h-12 w-full pr-10 text-sm", className)}
        />
        {query && !disabled && (
          <button
            type="button"
            aria-label="Vider le champ marque"
            title="Vider le champ marque"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => commit("")}
            className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            <X className="size-4" aria-hidden />
          </button>
        )}
      </div>

      {open && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Marques de gaz"
          className="absolute left-0 right-0 z-50 mt-1 max-h-60 overflow-y-auto rounded-xl border border-border bg-popover p-1.5 text-sm text-popover-foreground shadow-lg"
        >
          {options.map((option, index) => {
            const selected =
              option.isAll ? !value : value === option.value
            return (
              <li
                key={option.value || "all"}
                id={`${listboxId}-option-${index}`}
                role="option"
                aria-selected={selected}
              >
                <button
                  type="button"
                  disabled={disabled}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => commit(option.value)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    activeIndex === index || selected
                      ? "bg-primary/10 text-primary"
                      : "hover:bg-muted"
                  )}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {selected && <Check className="size-4 shrink-0" aria-hidden />}
                </button>
              </li>
            )
          })}

          {hasQuery && options.length === 0 && (
            <li
              role="presentation"
              className="px-3 py-2 text-xs text-muted-foreground"
            >
              Aucune marque ne correspond à « {query.trim()} ».
            </li>
          )}
        </ul>
      )}
    </div>
  )
}
