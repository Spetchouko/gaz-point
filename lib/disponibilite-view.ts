import type { AvailabilityStatus } from "@/db/schema"
import { availabilityLabel, formatDateTime, formatPrice } from "@/lib/gaz"
import type { SearchResultItem } from "@/lib/search-service"

/** Forme minimale de la réponse de GET /api/disponibilite/[id]. */
export type DisponibiliteApiData = {
  disponibilite: {
    id: string
    disponibiliteId?: string
    status: string | null
    note: string | null
    quantity: number | null
    reservedQuantity: number | null
    availableQuantity: number | null
    price: number | null
    brand: string | null
    format: string | null
    weightKg: string | null
    expiresAt: string | null
    phone: string | null
    reportedByName: string | null
    source: string | null
    delivery: boolean
    exchange: boolean
    gasSale: boolean
    stale: boolean
    expired: boolean
    updatedAt: string | null
  }
  pointDeVente: {
    id: string
    name: string
    district: string
    address: string
    phone: string | null
    deliveryEnabled: boolean
    deliveryFee: number | null
    exchangeEnabled: boolean
    gasSaleEnabled: boolean
  }
}

export type DisponibiliteServiceKey = "delivery" | "exchange" | "gasSale"

export type DisponibiliteService = {
  exchange: boolean
  gasSale: boolean
  delivery: boolean
  deliveryFeeLabel: string | null
}

export type DisponibiliteServiceOption = {
  key: DisponibiliteServiceKey
  label: string
  detail: string | null
}

export type DisponibiliteView = {
  disponibiliteId: string
  depotName: string
  localisation: string
  status: string | null
  statusLabel: string
  isReservable: boolean
  brand: string | null
  format: string | null
  weightKg: string | null
  priceLabel: string | null
  availableQuantity: number | null
  expiresAtLabel: string | null
  updatedAtLabel: string | null
  phone: string | null
  distanceKm: number | null
  note: string | null
  reportedByName: string | null
  services: DisponibiliteService
  /** Conditions uniquement lorsqu'elles sont réellement renseignées. */
  conditions: string[]
}

function readDateLabel(value: string | null): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return formatDateTime(date)
}

/**
 * Construit la vue affichée dans la fenêtre superposée à partir des données de
 * la carte sélectionnée, enrichies si possible par l'API de détail.
 * Aucune valeur d'une autre disponibilité ne peut fuir dans cette vue.
 */
export function buildDisponibiliteView(
  item: SearchResultItem,
  detail: DisponibiliteApiData | null
): DisponibiliteView {
  const dispo = detail?.disponibilite
  const point = detail?.pointDeVente

  const status = dispo?.status ?? item.status
  const expired = dispo?.expired ?? item.expired
  const availableQuantity = dispo?.availableQuantity ?? item.quantity
  const price = dispo?.price ?? item.price
  const note = dispo?.note ?? item.note
  const brand = dispo?.brand ?? item.brand
  const format = dispo?.format ?? item.format
  // La configuration du point de vente sélectionné est la source de vérité
  // dès que le détail est disponible. Les indicateurs de la disponibilité et
  // de la carte ne servent que de repli, pour ne jamais inventer de service.
  const deliveryEnabled = point?.deliveryEnabled ?? dispo?.delivery ?? item.hasDelivery
  const exchangeEnabled = point?.exchangeEnabled ?? dispo?.exchange ?? item.hasExchange
  const gasSaleEnabled = point?.gasSaleEnabled ?? dispo?.gasSale ?? item.hasGasSale
  const deliveryFee = point?.deliveryFee ?? item.deliveryFee

  const localisation = [point?.district ?? item.district, point?.address ?? item.address]
    .filter((part) => Boolean(part && part.trim()))
    .join(" — ")

  const statusLabel =
    availabilityLabel[status as AvailabilityStatus] ??
    (expired ? "Expirée" : "Statut inconnu")

  const conditions: string[] = []
  if (note) conditions.push(`Note du vendeur : ${note}`)
  if (price != null) conditions.push(`Prix affiché : ${formatPrice(price)}`)
  if (deliveryEnabled && deliveryFee != null) {
    conditions.push(`Livraison : ${formatPrice(deliveryFee)}`)
  }
  const expiresAtLabel = readDateLabel(dispo?.expiresAt ?? item.expiresAt)
  if (expiresAtLabel) conditions.push(`Valable jusqu'au : ${expiresAtLabel}`)
  if (dispo?.reportedByName) {
    conditions.push(`Signalé par : ${dispo.reportedByName}`)
  }

  return {
    disponibiliteId: item.disponibiliteId,
    depotName: point?.name ?? item.name,
    localisation,
    status,
    statusLabel,
    isReservable:
      (status === "disponible" || status === "a_confirmer") &&
      !expired &&
      (availableQuantity == null || availableQuantity > 0),
    brand,
    format,
    weightKg: dispo?.weightKg ?? null,
    priceLabel: price != null ? formatPrice(price) : null,
    availableQuantity,
    expiresAtLabel,
    updatedAtLabel: readDateLabel(dispo?.updatedAt ?? item.updatedAt),
    phone: point?.phone ?? dispo?.phone ?? item.phone ?? null,
    distanceKm: item.distanceKm,
    note,
    reportedByName: dispo?.reportedByName ?? null,
    services: {
      exchange: exchangeEnabled,
      gasSale: gasSaleEnabled,
      delivery: deliveryEnabled,
      deliveryFeeLabel: deliveryEnabled && deliveryFee != null ? formatPrice(deliveryFee) : null,
    },
    conditions,
  }
}

/**
 * Liste uniquement les services réellement activés, dans un ordre stable.
 * Aucune option n'est créée pour un service non renseigné par le vendeur.
 */
export function listDisponibiliteServices(
  view: DisponibiliteView
): DisponibiliteServiceOption[] {
  const services: DisponibiliteServiceOption[] = []

  if (view.services.delivery) {
    services.push({
      key: "delivery",
      label: "Livraison",
      detail: view.services.deliveryFeeLabel,
    })
  }
  if (view.services.exchange) {
    services.push({ key: "exchange", label: "Échange de bouteille", detail: null })
  }
  if (view.services.gasSale) {
    services.push({ key: "gasSale", label: "Vente de bouteille de gaz", detail: null })
  }

  return services
}

export function phoneHref(phone: string | null): string | null {
  if (!phone) return null
  const digits = phone.replace(/[^\d+]/g, "")
  return digits ? `tel:${digits}` : null
}
