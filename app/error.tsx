"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertCircle, RotateCcw } from "lucide-react"

interface ErrorPageProps {
  error: unknown
  retry: () => void
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message
  return "Une erreur inattendue est survenue."
}

export default function Error({ error, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error("Application error:", error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4 py-12">
      <div className="max-w-md text-center">
        <div className="mx-auto mb-6 flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircle className="size-6" aria-hidden />
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Une erreur est survenue</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Oops ! Quelque chose d’imprévu est arrivé. Notre site a rencontré une
          erreur intérieure.
        </p>
        <p className="mt-2 max-w-sm mx-auto text-xs text-muted-foreground">
          Réessayez, ou revenez à l’accueil si le problème persiste.
        </p>
        {process.env.NODE_ENV === "development" && (
          <p className="mt-3 break-words rounded-lg border border-destructive/20 bg-destructive/5 px-3 py-2 text-left text-xs text-destructive">
            {getErrorMessage(error)}
          </p>
        )}
        <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            type="button"
            onClick={retry}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:w-auto"
          >
            <RotateCcw className="size-4" aria-hidden />
            Réessayer
          </button>
          <Link
            href="/"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted sm:w-auto"
          >
            Revenir à l’accueil
          </Link>
        </div>
      </div>
    </div>
  )
}
