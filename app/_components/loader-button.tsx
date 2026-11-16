"use client"

import { Loader2 } from "lucide-react"
import { Button, type ButtonProps } from "@/components/ui/button"

export function LoaderButton({
  loading = false,
  loadingText = "Chargement en cours…",
  disabled = false,
  children,
  ...props
}: ButtonProps & { loading?: boolean; loadingText?: string }) {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading ? "true" : "false"}
      aria-live={loading ? "polite" : undefined}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2" aria-label={loadingText}>
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          {loadingText}
        </span>
      ) : (
        children
      )}
    </Button>
  )
}
