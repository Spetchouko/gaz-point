"use client"

import { LoadingSpinner } from "@/app/_components/loading-spinner"

export function PageLoader({ message = "Chargement en cours…" }: { message?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center" aria-live="polite" aria-busy="true">
      <LoadingSpinner text={message} />
    </div>
  )
}
