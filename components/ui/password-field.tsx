"use client"

import { useCallback, useRef, useState } from "react"
import { Copy, CheckCircle, Eye, EyeOff } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

type PasswordFieldProps = {
  id: string
  name?: string
  label: string
  placeholder?: string
  /** Mode contrôlé */
  value?: string
  /** Mode contrôlé */
  onChange?: (value: string) => void
  /** Mode non contrôlé */
  defaultValue?: string
  required?: boolean
  minLength?: number
  autoComplete?: string
  disabled?: boolean
  className?: string
  ref?: React.Ref<HTMLInputElement>
  /** Affiche le bouton "Copier" à côté du champ (jamais sur la page de connexion) */
  showCopy?: boolean
  /** Message de confirmation affiché discrètement après la copie */
  copyMessage?: string
  ariaInvalid?: boolean
  ariaDescribedby?: string
}

export function PasswordField({
  id,
  name,
  label,
  placeholder,
  value,
  onChange,
  defaultValue,
  required = false,
  minLength,
  autoComplete,
  disabled = false,
  className,
  ref,
  showCopy = false,
  copyMessage = "Mot de passe copié",
  ariaInvalid = false,
  ariaDescribedby,
}: PasswordFieldProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const isControlled = value !== undefined

  // Forward the external ref if provided
  const setRef = useCallback(
    (node: HTMLInputElement | null) => {
      inputRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    },
    [ref]
  )

  const handleShowPasswordToggle = useCallback(() => {
    setShowPassword((prev) => !prev)
  }, [])

  const handleCopy = useCallback(() => {
    const textToCopy = inputRef.current?.value ?? ""
    if (!textToCopy) return
    navigator.clipboard.writeText(textToCopy)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) onChange(e.target.value)
  }

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          name={name}
          type={showPassword ? "text" : "password"}
          placeholder={placeholder}
          {...(isControlled ? { value, onChange: handleInputChange } : { defaultValue })}
          required={required}
          minLength={minLength}
          autoComplete={autoComplete}
          disabled={disabled}
          className={cn(
            "pl-10 pr-10 h-11",
            showCopy ? "pr-20" : undefined,
            className
          )}
          ref={setRef}
          aria-invalid={ariaInvalid}
          aria-describedby={ariaDescribedby}
        />
        <button
          type="button"
          onClick={handleShowPasswordToggle}
          disabled={disabled}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={
            showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"
          }
        >
          {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
        {showCopy && (
          <button
            type="button"
            onClick={handleCopy}
            disabled={disabled}
            className={cn(
              "absolute right-10 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:pointer-events-none",
              copied ? "text-success" : undefined
            )}
            aria-label={copied ? "Copié !" : "Copier le mot de passe"}
          >
            {copied ? (
              <CheckCircle className="size-4 text-success" />
            ) : (
              <Copy className="size-4" />
            )}
          </button>
        )}
      </div>
      {copied && showCopy && (
        <p id={`${id}-copy-notice`} className="text-xs text-success" role="status">
          {copyMessage}
        </p>
      )}
    </div>
  )
}
