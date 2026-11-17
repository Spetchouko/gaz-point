/**
 * Couche de communication pour la fonctionnalité de recherche de gaz.
 *
 * Ce module prépare l'interface frontend à une connexion future avec un
 * backend. Aucune requête n'est envoyée vers une URL fictive : toutes les
 * appels utilisent l'URL configurée via variable d'environnement.
 *
 * En l'absence de configuration backend, la recherche continue d'utiliser
 * les routes Next.js existantes (/api/recherche, /api/disponibilites).
 *
 * Règles de sécurité :
 * - Aucun secret n'est exposé dans ce module.
 * - L'URL du backend provient exclusivement de NEXT_PUBLIC_SEARCH_API_URL.
 * - Les clés secrètes ne sont jamais incluses dans les requêtes frontend.
 */

import type { AvailabilityStatus } from "@/db/schema"

/**
 * Variables d'environnement utilisées par la couche de recherche.
 *
 * NEXT_PUBLIC_SEARCH_API_URL : URL de base du futur backend de recherche.
 * Si non définie, les routes Next.js internes sont utilisées.
 */
export const SEARCH_API_BASE_URL =
  process.env.NEXT_PUBLIC_SEARCH_API_URL ?? ""

/**
 * Statuts de disponibilité d'une bouteille de gaz.
 */
export type SearchAvailabilityStatus = "disponible" | "a_confirmer" | "indisponible"

/**
 * Source de l'information de disponibilité.
 */
export type SearchAvailabilitySource = "vendeur" | "administration"

/**
 * Critères de recherche envoyés au backend.
 */
export interface SearchCriteria {
  /** Marque de bouteille (ex: "Total", "Tradex", "SCTM", "Bocom"). Optionnel. */
  brand?: string | null
  /** Format de bouteille (ex: "6 kg", "12,5 kg", "15 kg"). Optionnel. */
  format?: string | null
  /** Quartier, ville ou point de repère. Optionnel. */
  zone?: string | null
  /** Limite maximale de résultats. Optionnel, défaut 50. */
  limit?: number
  /** Décalage pour pagination. Optionnel, défaut 0. */
  offset?: number
}

/**
 * Informations sur un point de vente retournées par le backend.
 */
export interface SearchPointDeVente {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  formats: string[]
  vendorId: string | null
  vendorName: string | null
  isActive: boolean
  deliveryEnabled: boolean
  deliveryFee: number
  exchangeEnabled: boolean
  gasSaleEnabled: boolean
}

/**
 * Informations sur une disponibilité de bouteille.
 */
export interface SearchDisponibilite {
  id: string
  pointId: string
  vendorId: string | null
  status: SearchAvailabilityStatus
  note: string | null
  quantity: number | null
  price: number | null // FCFA
  format: string | null
  brand: string | null
  expiresAt: string | null
  createdAt: string
  reportedByName: string | null
  source: SearchAvailabilitySource
  delivery: boolean
  exchange: boolean
  gasSale: boolean
}

/**
 * Résultat de recherche complet : un point de vente avec sa disponibilité.
 */
export interface SearchResult {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  formats: string[]
  status: SearchAvailabilityStatus | null
  note: string | null
  quantity: number | null
  price: number | null
  format: string | null
  brand: string | null
  expiresAt: string | null
  updatedAt: string | null
  updatedBy: string | null
  source: SearchAvailabilitySource | null
  stale: boolean
  expired: boolean
  disponibiliteId: string
  // Services
  hasDelivery: boolean
  hasExchange: boolean
  hasGasSale: boolean
  deliveryFee: number | null
  // Métadonnées point de vente enrichies
  vendorId: string | null
  vendorName: string | null
  deliveryEnabled: boolean
  deliveryFeePoint: number | null
  exchangeEnabled: boolean
  gasSaleEnabled: boolean
}

/**
 * Réponse du backend à une requête de recherche.
 */
export interface SearchResponse {
  results: SearchResult[]
  total: number
  limit: number
  offset: number
}

/**
 * Erreur retournée par le service de recherche.
 */
export interface SearchError {
  message: string
  code?: string
  statusCode?: number
}

/**
 * État de la recherche.
 */
export type SearchState =
  | { kind: "idle" }
  | { kind: "searching" }
  | { kind: "success"; results: SearchResult[]; total: number }
  | { kind: "empty" }
  | { kind: "error"; error: SearchError }

/**
 * Crée une erreur de recherche standardisée.
 */
export function createSearchError(
  message: string,
  options?: { code?: string; statusCode?: number }
): SearchError {
  return {
    message,
    code: options?.code,
    statusCode: options?.statusCode,
  }
}

/**
 * Construit l'URL complète pour la requête de recherche.
 *
 * Si NEXT_PUBLIC_SEARCH_API_URL est définie, on l'utilise comme base.
 * Sinon, on utilise la route Next.js interne /api/recherche.
 */
export function buildSearchUrl(criteria: SearchCriteria): string {
  const base = SEARCH_API_BASE_URL
    ? `${SEARCH_API_BASE_URL}/search`
    : "/api/recherche"

  const params = new URLSearchParams()
  if (criteria.brand) params.set("brand", criteria.brand)
  if (criteria.format) params.set("format", criteria.format)
  if (criteria.zone) params.set("zone", criteria.zone)
  if (criteria.limit) params.set("limit", String(criteria.limit))
  if (criteria.offset) params.set("offset", String(criteria.offset))

  return `${base}?${params.toString()}`
}

/**
 * Construit l'URL pour récupérer les données de service d'une disponibilité.
 */
export function buildDisponibiliteUrl(ids: string[]): string {
  const base = SEARCH_API_BASE_URL
    ? `${SEARCH_API_BASE_URL}/disponibilites`
    : "/api/disponibilites"

  const params = new URLSearchParams()
  ids.forEach((id) => params.append("ids", id))

  return `${base}?${params.toString()}`
}

/**
 * Effectue une requête de recherche vers le backend (ou route Next.js).
 *
 * Gère l'annulation via AbortController, les timeouts, et transforme
 * la réponse brute en SearchResult[] typé.
 *
 * @param criteria - Critères de recherche
 * @param signal - Signal d'annulation optionnel (AbortController.signal)
 * @returns Promise résolue avec SearchResponse
 * @throws SearchError en cas d'échec
 */
export async function searchGas(
  criteria: SearchCriteria,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const url = buildSearchUrl(criteria)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal,
    })

    if (!response.ok) {
      throw createSearchError(
        `Erreur lors de la recherche (${response.status})`,
        {
          code: "SEARCH_HTTP_ERROR",
          statusCode: response.status,
        }
      )
    }

    const data = (await response.json()) as SearchResponse

    // Valider la structure minimale de la réponse
    if (!Array.isArray(data.results)) {
      throw createSearchError("Réponse du serveur invalide : résultats manquants", {
        code: "INVALID_RESPONSE",
        statusCode: 500,
      })
    }

    return data
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw createSearchError("Recherche annulée", {
        code: "SEARCH_ABORTED",
        statusCode: 0,
      })
    }
    if (err instanceof Error && (err as SearchError).code) {
      throw err
    }
    throw createSearchError(
      err instanceof Error ? err.message : "Erreur inconnue lors de la recherche",
      { code: "SEARCH_UNKNOWN_ERROR" }
    )
  }
}

/**
 * Récupère les données de service (livraison, échange, gaz sale, frais)
 * pour une liste de disponibilités.
 *
 * @param ids - IDs des disponibilités
 * @param signal - Signal d'annulation optionnel
 * @returns Map des disponibilités par ID
 */
export async function fetchDisponibiliteServices(
  ids: string[],
  signal?: AbortSignal
): Promise<Map<string, { delivery: boolean; exchange: boolean; gasSale: boolean; price: number | null }>> {
  if (ids.length === 0) return new Map()

  const url = buildDisponibiliteUrl(ids)

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      signal,
    })

    if (!response.ok) {
      // Échec silencieux : les services sont optionnels
      return new Map()
    }

    const data = (await response.json()) as Array<{
      id: string
      delivery: boolean
      exchange: boolean
      gasSale: boolean
      price: number | null
    }>

    const map = new Map<string, { delivery: boolean; exchange: boolean; gasSale: boolean; price: number | null }>()
    for (const item of data) {
      map.set(item.id, {
        delivery: item.delivery,
        exchange: item.exchange,
        gasSale: item.gasSale,
        price: item.price,
      })
    }
    return map
  } catch {
    // Échec silencieux : les services sont optionnels
    return new Map()
  }
}

/**
 * Transforme une réponse brute du backend en SearchResult[] avec enrichissement
 * des données de service.
 *
 * Cette fonction est utilisée par le composant de recherche pour adapter
 * le format backend au format attendu par l'interface.
 */
export function mapSearchResponse(
  response: SearchResponse,
  serviceMap?: Map<string, { delivery: boolean; exchange: boolean; gasSale: boolean; price: number | null }>
): SearchResult[] {
  return response.results.map((result) => {
    const services = serviceMap?.get(result.disponibiliteId)
    return {
      ...result,
      hasDelivery: services?.delivery ?? false,
      hasExchange: services?.exchange ?? false,
      hasGasSale: services?.gasSale ?? false,
      deliveryFee: services?.price ?? null,
      vendorId: result.vendorId ?? null,
      vendorName: result.vendorName ?? null,
      deliveryEnabled: result.deliveryEnabled,
      deliveryFeePoint: result.deliveryFee,
      exchangeEnabled: result.exchangeEnabled,
      gasSaleEnabled: result.gasSaleEnabled,
    }
  })
}

/**
 * Valide les critères de recherche avant envoi.
 *
 * Retourne un objet avec `ok` et éventuellement `field` + `message`.
 */
export function validateSearchCriteria(criteria: SearchCriteria): {
  ok: true
} | { ok: false; field: keyof SearchCriteria; message: string } {
  if (criteria.brand && criteria.brand.trim().length > 100) {
    return {
      ok: false,
      field: "brand",
      message: "Le nom de marque est trop long.",
    }
  }
  if (criteria.format && criteria.format.trim().length > 50) {
    return {
      ok: false,
      field: "format",
      message: "Le format est trop long.",
    }
  }
  if (criteria.zone && criteria.zone.trim().length > 200) {
    return {
      ok: false,
      field: "zone",
      message: "La zone est trop longue.",
    }
  }
  if (criteria.limit !== undefined && (criteria.limit < 1 || criteria.limit > 100)) {
    return {
      ok: false,
      field: "limit",
      message: "La limite doit être comprise entre 1 et 100.",
    }
  }
  if (criteria.offset !== undefined && criteria.offset < 0) {
    return {
      ok: false,
      field: "offset",
      message: "Le décalage ne peut pas être négatif.",
    }
  }
  return { ok: true }
}

/**
 * Formats de bouteille supportés (marché camerounais).
 */
export const SEARCH_BOTTLE_FORMATS = [
  "2,75 kg",
  "6 kg",
  "12,5 kg",
  "20 kg",
  "28 kg",
  "35 kg",
  "50 kg",
] as const

/**
 * Marques de bouteille courantes (à afficher comme suggestions).
 */
export const SEARCH_BRANDS = ["Tradex", "Total", "SCTM", "Bocom"] as const
