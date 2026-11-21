export type HistoryDateFilter =
  | "all"
  | "today"
  | "week"
  | "month"
  | "year"

export function getHistoryDateThreshold(
  filter: HistoryDateFilter,
  now = new Date()
): Date | null {
  if (filter === "all") return null

  const threshold = new Date(now)
  if (filter === "today") {
    threshold.setHours(0, 0, 0, 0)
    return threshold
  }

  if (filter === "week") {
    const day = threshold.getDay()
    const daysSinceMonday = day === 0 ? 6 : day - 1
    threshold.setDate(threshold.getDate() - daysSinceMonday)
    threshold.setHours(0, 0, 0, 0)
    return threshold
  }

  if (filter === "month") {
    threshold.setDate(1)
    threshold.setHours(0, 0, 0, 0)
    return threshold
  }

  threshold.setMonth(0, 1)
  threshold.setHours(0, 0, 0, 0)
  return threshold
}

export function isInHistoryDateRange(
  value: string | Date,
  filter: HistoryDateFilter,
  now = new Date()
): boolean {
  const threshold = getHistoryDateThreshold(filter, now)
  if (!threshold) return true

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return false
  return date.getTime() >= threshold.getTime()
}

export function buildSearchHistoryHref(item: {
  brand?: string | null
  format?: string | null
  zone?: string | null
}): string {
  const params = new URLSearchParams()
  if (item.brand) params.set("brand", item.brand)
  if (item.format) params.set("format", item.format)
  if (item.zone) params.set("zone", item.zone)

  const query = params.toString()
  return query ? `/dashboard/recherches?${query}` : "/dashboard/recherches"
}

export function buildReservationHistoryHref(reservationId: string): string {
  return `/dashboard/reservations?reservation=${encodeURIComponent(reservationId)}`
}

export function getReservationStatusLabel(status: string): string {
  switch (status) {
    case "confirmed":
      return "Confirmée"
    case "collected":
      return "Récupérée"
    case "cancelled":
      return "Annulée"
    case "pending":
      return "En attente"
    case "expired":
      return "Expirée"
    default:
      return status
  }
}
