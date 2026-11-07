"use client"

import { useCallback, useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  COUNTRY_CODE,
  NATIONAL_NUMBER_LENGTH,
  extractNationalDigits,
  isValidNationalNumber,
  normalizePhone,
} from "@/lib/phone"

/**
 * Composant de saisie de téléphone camerounais.
 *
 * - Affiche "+237 " de manière permanente (préfixe non modifiable).
 * - L'utilisateur ne saisit que les 9 chiffres du numéro national.
 * - Refuse tout caractère non numérique et limite à 9 chiffres.
 * - Retourne la valeur normalisée (+237XXXXXXXXX) ou null si vide/invalide.
 *
 * Exemple d'affichage : +237 | 690123456
 *
 * @param props - { value, onChange, disabled, required, id, label, className, error }
 */
export function PhoneInput({
  value,
  onChange,
  disabled,
  required = false,
  id,
  name,
  label,
  className,
  error,
}: {
  value?: string | null
  onChange?: (normalized: string | null) => void
  disabled?: boolean
  required?: boolean
  id?: string
  name?: string
  label?: string
  className?: string
  error?: string
}) {
  const [nationalDigits, setNationalDigits] = useState("")

  // Initialise les chiffres nationaux à partir de la valeur stockée (normalisée ou non).
  const initial = useMemo(() => extractNationalDigits(value ?? undefined), [value])

  useCallback(() => {
    setNationalDigits(initial)
  }, [initial])

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const raw = event.target.value
    // Garde uniquement les chiffres, limité à 9.
    const digits = raw.replace(/\D/g, "").slice(0, NATIONAL_NUMBER_LENGTH)
    setNationalDigits(digits)
    onChange?.(isValidNationalNumber(digits) ? normalizePhone(digits) : null)
  }

  const normalized = isValidNationalNumber(nationalDigits)
    ? normalizePhone(nationalDigits)
    : null

  return (
    <div className={cn("relative", className)}>
      {label && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-muted-foreground mb-1"
        >
          {label}
        </label>
      )}
      <div className={cn("flex items-center", disabled && "opacity-60 pointer-events-none")}>
        <span className={cn(
          "shrink-0 flex items-center justify-center rounded-l-lg border border-r-0 bg-muted px-2.5 text-sm font-medium text-muted-foreground",
          disabled && "bg-muted/50",
        )}>
          {COUNTRY_CODE}
        </span>
        <Input
          id={id}
          name={name}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={NATIONAL_NUMBER_LENGTH}
          autoComplete="tel"
          value={nationalDigits}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          placeholder={`690123456`}
          className={cn(
            "pl-8 rounded-r-lg focus:ring-0",
            error && "border-destructive focus:border-destructive",
            className,
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        {name && normalized && (
          <input type="hidden" name={name} value={normalized} />
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="mt-1 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  )
}

export { COUNTRY_CODE, NATIONAL_NUMBER_LENGTH, extractNationalDigits, normalizePhone, isValidNationalNumber }
