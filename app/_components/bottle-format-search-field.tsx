"use client"

import type { ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import { PREDEFINED_BOTTLE_FORMATS } from "@/lib/bottle-formats"
import { cn } from "@/lib/utils"

type BottleFormatSearchFieldProps = {
  id: string
  value: string
  onChange: (value: string) => void
  className?: string
  inputClassName?: string
  placeholder?: string
  allowAllOption?: boolean
  allOptionLabel?: string
  leftAdornment?: ReactNode
}

/**
 * Champ de recherche grammage centralisé : liste des formats prédéfinis +
 * saisie libre. La valeur vide représente "tous les formats" dans la recherche.
 */
export function BottleFormatSearchField({
  id,
  value,
  onChange,
  className,
  inputClassName,
  placeholder = "Tous les formats ou saisir un grammage",
  allowAllOption = true,
  allOptionLabel = "Tous les formats",
  leftAdornment,
}: BottleFormatSearchFieldProps) {
  const listId = `${id}-options`

  return (
    <div className={cn("relative", className)}>
      {leftAdornment}
      <input
        id={id}
        list={listId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete="off"
        className={cn(
          "h-11 w-full rounded-xl border border-border bg-background pr-10 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:border-primary placeholder:text-muted-foreground",
          leftAdornment ? "pl-10" : "pl-3",
          inputClassName
        )}
      />
      <ChevronDown
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <datalist id={listId}>
        {allowAllOption ? <option value="">{allOptionLabel}</option> : null}
        {PREDEFINED_BOTTLE_FORMATS.map((format) => (
          <option key={format} value={format} />
        ))}
      </datalist>
    </div>
  )
}

export { PREDEFINED_BOTTLE_FORMATS } from "@/lib/bottle-formats"
