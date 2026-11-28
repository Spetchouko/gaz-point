"use client"

import { RESULTS_PATH, PUBLIC_RESULTS_PATH } from "@/lib/auth-routing"

export type SearchCriteria = {
  brand?: string | null
  format?: string | null
  zone?: string | null
  available?: boolean | null
  lat?: number | null
  lng?: number | null
}

export type SearchResultItem = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[]
  formats: string[]
  status: "disponible" | "a_confirmer" | "indisponible" | null
  note: string | null
  quantity: number | null
  price: number | null
  format: string | null
  brand: string | null
  expiresAt: string | null
  updatedAt: string | null
  updatedBy: string | null
  source: string | null
  stale: boolean
  expired: boolean
  disponibiliteId: string
  hasDelivery: boolean
  hasExchange: boolean
  hasGasSale: boolean
  deliveryFee: number | null
  distanceKm: number | null
}

export type SearchResponse = {
  results: SearchResultItem[]
  count: number
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
  disponibiliteIds: string[]
}

export class SearchError extends Error {
  readonly code: string
  readonly status?: number

  constructor(code: string, message: string, status?: number) {
    super(message)
    this.name = "SearchError"
    this.code = code
    this.status = status
  }
}

/** Coordonnée GPS valide, ou null pour une valeur absente ou incohérente. */
export function normalizeCoordinate(
  value: number | null | undefined,
  limit: number
): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null
  if (value < -limit || value > limit) return null
  return value
}

/**
 * Couche de service dédiée à la recherche de disponibilités de gaz.
 *
 * Cette couche sépare :
 *   - la construction des critères de recherche (SearchCriteria)
 *   - l'appel vers l'API (fetch)
 *   - la normalisation de la réponse (SearchResponse)
 *
 * Elle est conçue pour être facilement branchée sur le futur backend
 * sans reconstruire le formulaire. Remplacer uniquement le corps de
 * `searchAvailability` lorsque l'API sera opérationnelle.
 */
export class SearchService {
  private baseUrl: string

  constructor(baseUrl = "/api/recherche") {
    this.baseUrl = baseUrl
  }

  /**
   * Normalise les critères de recherche en supprimant les valeurs vides.
   */
  normalizeCriteria(criteria: Partial<SearchCriteria>): SearchCriteria {
    return {
      brand: criteria.brand ?? null,
      format: criteria.format ?? null,
      zone: criteria.zone ?? null,
      available: criteria.available ?? null,
      // La localisation fait partie des critères : elle doit survivre à la
      // normalisation, sinon l'API ne reçoit jamais lat/lng et ne peut ni trier
      // par distance ni renseigner distanceKm.
      lat: normalizeCoordinate(criteria.lat, 90),
      lng: normalizeCoordinate(criteria.lng, 180),
    }
  }

  /**
   * Construit l'URL de recherche à partir des critères avec pagination.
   */
  buildSearchUrl(criteria: SearchCriteria, page = 1, pageSize = 20): string {
    const params = new URLSearchParams()
    if (criteria.brand) params.set("brand", criteria.brand)
    if (criteria.format) params.set("format", criteria.format)
    if (criteria.zone) params.set("zone", criteria.zone)
    if (criteria.lat != null) params.set("lat", String(criteria.lat))
    if (criteria.lng != null) params.set("lng", String(criteria.lng))
    if (criteria.available !== null && criteria.available !== undefined) {
      params.set("available", String(criteria.available))
    }
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    return `${this.baseUrl}?${params.toString()}`
  }

  /**
   * Construit l'URL de recherche publique à partir des critères avec pagination.
   */
  buildPublicSearchUrl(criteria: SearchCriteria, page = 1, pageSize = 50): string {
    const params = new URLSearchParams()
    if (criteria.brand) params.set("brand", criteria.brand)
    if (criteria.format) params.set("format", criteria.format)
    if (criteria.zone) params.set("zone", criteria.zone)
    if (criteria.lat != null) params.set("lat", String(criteria.lat))
    if (criteria.lng != null) params.set("lng", String(criteria.lng))
    if (criteria.available !== null && criteria.available !== undefined) {
      params.set("available", String(criteria.available))
    }
    params.set("page", String(page))
    params.set("pageSize", String(pageSize))
    return `/api/recherche-publique?${params.toString()}`
  }

  /**
   * Sérialise les critères dans l'URL publique. Le format est conservé même
   * vide afin de pouvoir distinguer « tous les formats » du format par défaut
   * lors d'un rechargement ou d'un retour au formulaire.
   */
  private buildCriteriaParams(criteria: SearchCriteria): URLSearchParams {
    const params = new URLSearchParams()
    if (criteria.brand) params.set("brand", criteria.brand.trim())
    if (criteria.format !== null && criteria.format !== undefined) {
      params.set("format", criteria.format.trim())
    }
    if (criteria.zone) params.set("zone", criteria.zone.trim())
    if (criteria.lat != null) params.set("lat", String(criteria.lat))
    if (criteria.lng != null) params.set("lng", String(criteria.lng))
    return params
  }

  /**
   * URL de la page dédiée aux résultats, criteria inclus dans la query.
   * `path` permet de rester dans l'espace du dashboard qui a lancé la
   * recherche, sans toucher à sa navigation.
   */
  buildResultsUrl(criteria: SearchCriteria, path = RESULTS_PATH): string {
    const query = this.buildCriteriaParams(criteria).toString()
    return query ? `${path}?${query}` : path
  }

  /**
   * URL de la page dédiée aux résultats publics (sans authentification).
   */
  buildPublicResultsUrl(criteria: SearchCriteria): string {
    const query = this.buildCriteriaParams(criteria).toString()
    return query ? `${PUBLIC_RESULTS_PATH}?${query}` : PUBLIC_RESULTS_PATH
  }

  /** Retour vers le formulaire de la landing, avec les critères pré-remplis. */
  buildEditSearchUrl(criteria: SearchCriteria): string {
    const query = this.buildCriteriaParams(criteria).toString()
    return query ? `/?${query}#recherche-gaz` : `/#recherche-gaz`
  }

  /**
   * Effectue une recherche de disponibilités avec pagination (API authentifiée).
   *
   * Actuellement : appelle l'API existante `/api/recherche`.
   * Futur : remplacer le corps par l'appel vers le nouveau backend Neon.
   *
   * @throws SearchError en cas d'échec réseau ou de réponse invalide.
   */
  async search(
    criteria: SearchCriteria,
    options: { page?: number; pageSize?: number; signal?: AbortSignal } = {}
  ): Promise<SearchResponse> {
    const { page = 1, pageSize = 20, signal } = options
    const url = this.buildSearchUrl(criteria, page, pageSize)

    let res: Response
    try {
      res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      })
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        throw new SearchError("ABORTED", "Recherche annulée.")
      }
      throw new SearchError(
        "NETWORK_ERROR",
        "Impossible de joindre le serveur. Vérifiez votre connexion Internet, puis réessayez."
      )
    }

    if (!res.ok) {
      const status = res.status
      if (status === 401 || status === 403) {
        throw new SearchError(
          "AUTH_REQUIRED",
          "Votre session a expiré. Reconnectez-vous pour consulter vos résultats.",
          status
        )
      }
      if (status >= 500) {
        throw new SearchError(
          "SERVER_ERROR",
          "Le service de recherche est momentanément indisponible. Réessayez plus tard.",
          status
        )
      }
      throw new SearchError(
        "SEARCH_FAILED",
        "La recherche n'a pas pu être effectuée. Vérifiez vos critères et réessayez.",
        status
      )
    }

    let data: unknown
    try {
      data = await res.json()
    } catch {
      throw new SearchError(
        "INVALID_RESPONSE",
        "La réponse du serveur est invalide."
      )
    }

    return this.normalizeResponse(data)
  }

  /**
   * Effectue une recherche publique de disponibilités avec pagination (API sans authentification).
   *
   * Appelle l'API `/api/recherche-publique`.
   *
   * @throws SearchError en cas d'échec réseau ou de réponse invalide.
   */
  async searchPublic(
    criteria: SearchCriteria,
    options: { page?: number; pageSize?: number; signal?: AbortSignal } = {}
  ): Promise<SearchResponse> {
    const { page = 1, pageSize = 50, signal } = options
    const url = this.buildPublicSearchUrl(criteria, page, pageSize)

    let res: Response
    try {
      res = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal,
      })
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === "AbortError")) {
        throw new SearchError("ABORTED", "Recherche annulée.")
      }
      throw new SearchError(
        "NETWORK_ERROR",
        "Impossible de joindre le serveur. Vérifiez votre connexion Internet, puis réessayez."
      )
    }

    if (!res.ok) {
      const status = res.status
      // L'API publique ne devrait jamais retourner 401/403, mais on gère quand même
      if (status === 401 || status === 403) {
        throw new SearchError(
          "AUTH_REQUIRED",
          "Votre session a expiré. Reconnectez-vous pour consulter vos résultats.",
          status
        )
      }
      if (status >= 500) {
        throw new SearchError(
          "SERVER_ERROR",
          "Le service de recherche est momentanément indisponible. Réessayez plus tard.",
          status
        )
      }
      throw new SearchError(
        "SEARCH_FAILED",
        "La recherche n'a pas pu être effectuée. Vérifiez vos critères et réessayez.",
        status
      )
    }

    let data: unknown
    try {
      data = await res.json()
    } catch {
      throw new SearchError(
        "INVALID_RESPONSE",
        "La réponse du serveur est invalide."
      )
    }

    return this.normalizeResponse(data)
  }

  /**
   * Normalise la réponse brute de l'API vers le type SearchResponse.
   * Cette méthode peut être adaptée lorsque le contrat du backend changera.
   */
  private normalizeResponse(data: unknown): SearchResponse {
    if (!data || typeof data !== "object") {
      throw new SearchError(
        "INVALID_RESPONSE",
        "La réponse du serveur est invalide."
      )
    }

    const raw = data as Record<string, unknown>
    // Une réponse 200 sans tableau de résultats est un défaut de contrat :
    // ce n'est pas une recherche sans disponibilité.
    if (!Array.isArray(raw.results)) {
      throw new SearchError(
        "INVALID_RESPONSE",
        "La réponse du serveur est invalide."
      )
    }

    const results: SearchResultItem[] = raw.results.map((item) =>
      this.normalizeResultItem(item)
    )

    const disponibiliteIds: string[] = Array.isArray(
      raw.disponibiliteIds
    )
      ? raw.disponibiliteIds.filter((id) => typeof id === "string")
      : []

    const count =
      typeof raw.count === "number" && Number.isFinite(raw.count)
        ? raw.count
        : results.length

    const totalCount =
      typeof raw.totalCount === "number" && Number.isFinite(raw.totalCount)
        ? raw.totalCount
        : count

    const page =
      typeof raw.page === "number" && Number.isFinite(raw.page)
        ? raw.page
        : 1

    const pageSize =
      typeof raw.pageSize === "number" && Number.isFinite(raw.pageSize)
        ? raw.pageSize
        : 20

    const totalPages =
      typeof raw.totalPages === "number" && Number.isFinite(raw.totalPages)
        ? raw.totalPages
        : Math.ceil(totalCount / pageSize)

    return {
      results,
      count,
      totalCount,
      page,
      pageSize,
      totalPages,
      disponibiliteIds,
    }
  }

  private normalizeResultItem(item: unknown): SearchResultItem {
    const raw = item as Record<string, unknown>

    return {
      id: String(raw.id ?? ""),
      name: String(raw.name ?? ""),
      district: String(raw.district ?? ""),
      address: String(raw.address ?? ""),
      phone: raw.phone ? String(raw.phone) : null,
      brands: Array.isArray(raw.brands) ? raw.brands.filter((b) => typeof b === "string") : [],
      formats: Array.isArray(raw.formats) ? raw.formats.filter((f) => typeof f === "string") : [],
      status:
        raw.status === "disponible" ||
        raw.status === "a_confirmer" ||
        raw.status === "indisponible"
          ? (raw.status as "disponible" | "a_confirmer" | "indisponible")
          : null,
      note: raw.note ? String(raw.note) : null,
      quantity:
        typeof raw.quantity === "number" ? raw.quantity : raw.quantity ? Number(raw.quantity) : null,
      price:
        typeof raw.price === "number" ? raw.price : raw.price ? Number(raw.price) : null,
      format: raw.format ? String(raw.format) : null,
      brand: raw.brand ? String(raw.brand) : null,
      expiresAt: raw.expiresAt ? String(raw.expiresAt) : null,
      updatedAt: raw.updatedAt ? String(raw.updatedAt) : null,
      updatedBy: raw.updatedBy ? String(raw.updatedBy) : null,
      source: raw.source ? String(raw.source) : null,
      stale: Boolean(raw.stale),
      expired: Boolean(raw.expired),
      disponibiliteId: String(raw.disponibiliteId ?? ""),
      hasDelivery: Boolean(raw.hasDelivery),
      hasExchange: Boolean(raw.hasExchange),
      hasGasSale: Boolean(raw.hasGasSale),
      deliveryFee:
        typeof raw.deliveryFee === "number"
          ? raw.deliveryFee
          : raw.deliveryFee
          ? Number(raw.deliveryFee)
          : null,
      distanceKm:
        raw.distanceKm != null && !Number.isNaN(Number(raw.distanceKm))
          ? Number(raw.distanceKm)
          : null,
    }
  }
}

export const searchService = new SearchService()
