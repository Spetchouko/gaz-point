"use client"

import { useRouter } from "next/navigation"

/**
 * Sélecteur de période des statistiques.
 * Utilise `router.push` (navigation client) plutôt que de réassigner
 * `window.location.search`, qui provoque un rechargement complet de la page.
 */
export function StatsRangeSelector({
  currentKey,
  fromInput,
  toInput,
}: {
  currentKey: string
  fromInput: string
  toInput: string
}) {
  const router = useRouter()

  const navigate = (next: Record<string, string>) => {
    const params = new URLSearchParams()
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value)
    }
    router.push(`/admin/statistiques?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <select
        defaultValue={currentKey}
        onChange={(event) => {
          const period = event.target.value
          navigate({
            period,
            from: period === "custom" ? fromInput : "",
            to: period === "custom" ? toInput : "",
          })
        }}
        className="h-9 rounded-lg border bg-background px-3 py-1.5 text-sm"
        aria-label="Période analysée"
      >
        <option value="today">Aujourd&apos;hui</option>
        <option value="7">7 derniers jours</option>
        <option value="30">30 derniers jours</option>
        <option value="90">90 derniers jours</option>
        <option value="custom">Période personnalisée</option>
      </select>

      {currentKey === "custom" && (
        <>
          <input
            type="date"
            defaultValue={fromInput}
            onChange={(event) =>
              navigate({ period: "custom", from: event.target.value, to: toInput })
            }
            className="h-9 rounded-lg border bg-background px-3 text-sm"
            aria-label="Date de début"
          />
          <span className="text-muted-foreground">→</span>
          <input
            type="date"
            defaultValue={toInput}
            onChange={(event) =>
              navigate({ period: "custom", from: fromInput, to: event.target.value })
            }
            className="h-9 rounded-lg border bg-background px-3 text-sm"
            aria-label="Date de fin"
          />
        </>
      )}
    </div>
  )
}
