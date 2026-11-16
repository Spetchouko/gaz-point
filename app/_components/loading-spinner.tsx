"use client"

import { Loader2 } from "lucide-react"

export function LoadingSpinner({ text, className = "" }: { text?: string; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-muted-foreground ${className}`} aria-live="polite" aria-busy="true">
      <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
      {text ?? "Chargement en cours…"}
    </span>
  )
}
