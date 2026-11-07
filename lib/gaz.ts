import type { AvailabilitySource, AvailabilityStatus } from "@/db/schema"

export const availabilityLabel: Record<AvailabilityStatus, string> = {
  disponible: "Disponible",
  a_confirmer: "À confirmer",
  indisponible: "Indisponible",
}

export const availabilityBadgeClass: Record<AvailabilityStatus, string> = {
  disponible: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
  a_confirmer: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  indisponible: "bg-red-500/10 text-red-600 border-red-500/30",
}

export const sourceLabel: Record<AvailabilitySource, string> = {
  vendeur: "Signalement du vendeur",
  administration: "Signalement de l’administration",
}

export const bottleFormats = ["6 kg", "12,5 kg", "15 kg"] as const

export const STALE_AFTER_MS = 24 * 60 * 60 * 1000

export function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value)
}

export function isStale(value: Date | string): boolean {
  return Date.now() - toDate(value).getTime() > STALE_AFTER_MS
}

export function effectiveStatus(
  status: string,
  updatedAt: Date | string
): AvailabilityStatus {
  if (isStale(updatedAt)) return "a_confirmer"
  return status as AvailabilityStatus
}

export function formatDateTime(value: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(toDate(value))
}

export function formatDate(value: Date | string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
  }).format(toDate(value))
}

export function formatPrice(price: number): string {
  return `${new Intl.NumberFormat("fr-FR").format(price)} FCFA`
}
