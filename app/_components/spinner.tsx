"use client"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

type SpinnerProps = {
  size?: "sm" | "md" | "lg"
  className?: string
  text?: string
}

/**
 * Indicateur de chargement circulaire animé unique pour tout le site GazPoints.
 * Utilise la couleur primaire (vert) de la charte graphique.
 */
export function Spinner({ size = "md", className, text }: SpinnerProps) {
  const sizeClass = {
    sm: "size-4",
    md: "size-6",
    lg: "size-8",
  }[size]

  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 text-sm text-muted-foreground",
        className,
      )}
      aria-live="polite"
      aria-busy="true"
    >
      <Loader2
        className={cn("animate-spin text-primary", sizeClass)}
        aria-hidden="true"
      />
      {text && <span className="text-xs">{text}</span>}
    </span>
  )
}

/**
 * Indicateur de chargement pour une page entière (centré, sans texte par défaut).
 */
export function PageLoading({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 py-12",
        className,
      )}
    >
      <Spinner size="lg" />
    </div>
  )
}

/**
 * Indicateur de chargement à l'intérieur d'un bouton.
 */
export function ButtonSpinner({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
    </span>
  )
}
