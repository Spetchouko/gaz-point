"use client"

import { Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { useLang } from "./lang-provider"

export type FeedbackState = "idle" | "loading" | "success" | "error"

export interface ActionFeedbackProps {
  state: FeedbackState
  loadingText?: string
  successText?: string
  errorText?: string
  className?: string
}

const i18n = {
  fr: {
    loading: "Chargement en cours…",
    success: "Opération réussie.",
    error: "Une erreur est survenue. Réessaie.",
  },
  en: {
    loading: "Loading…",
    success: "Done.",
    error: "Something went wrong. Try again.",
  },
}

export function ActionFeedback({
  state,
  loadingText,
  successText,
  errorText,
  className = "",
}: ActionFeedbackProps) {
  if (state === "idle") return null

  let lang: "fr" | "en" = "fr"
  try {
    const ctx = useLang()
    lang = ctx.lang
  } catch {}
  const isFr = lang === "fr"
  // On affiche directement selon l'état avec les textes donnés
  if (state === "loading") {
    return (
      <span
        className={`inline-flex items-center gap-2 text-sm text-muted-foreground ${className}`}
        aria-live="polite"
        aria-busy="true"
      >
        <Loader2 className="size-4 animate-spin text-primary" aria-hidden="true" />
        <span>{loadingText ?? (isFr ? i18n.fr.loading : i18n.en.loading)}</span>
      </span>
    )
  }

  if (state === "success") {
    return (
      <span
        className={`inline-flex items-center gap-2 text-sm text-success ${className}`}
        aria-live="assertive"
        role="status"
      >
        <CheckCircle2 className="size-4 text-success" aria-hidden="true" />
        <span>{successText ?? (isFr ? i18n.fr.success : i18n.en.success)}</span>
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-2 text-sm text-destructive ${className}`}
      aria-live="assertive"
      role="alert"
    >
      <AlertCircle className="size-4 text-destructive" aria-hidden="true" />
      <span>{errorText ?? (isFr ? i18n.fr.error : i18n.en.error)}</span>
    </span>
  )
}
