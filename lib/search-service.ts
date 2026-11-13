"use client"

export type SearchCriteria = {
  brand?: string | null
  format?: string | null
  zone?: string | null
  available?: boolean | null
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
}

export type SearchResponse = {
  results: SearchResultItem[]
  count: number
  disponibiliteIds: string[]
}

export type SearchError = {
  code: string
  message: string
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
    }
  }

  /**
   * Construit l'URL de recherche à partir des critères.
   */
  buildSearchUrl(criteria: SearchCriteria): string {
    const params = new URLSearchParams()
    if (criteria.brand) params.set("brand", criteria.brand)
    if (criteria.format) params.set("format", criteria.format)
    if (criteria.zone) params.set("zone", criteria.zone)
    if (criteria.available !== null && criteria.available !== undefined) {
      params.set("available", String(criteria.available))
    }
    return `${this.baseUrl}?${params.toString()}`
  }

  /**
   * Effectue une recherche de disponibilités.
   *
   * Actuellement : appelle l'API existante `/api/recherche`.
   * Futur : remplacer le corps par l'appel vers le nouveau backend Neon.
   *
   * @throws SearchError en cas d'échec réseau ou de réponse invalide.
   */
  async search(criteria: SearchCriteria): Promise<SearchResponse> {
    const url = this.buildSearchUrl(criteria)

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      })

      if (!res.ok) {
        throw new SearchError(
          "SEARCH_FAILED",
          `La recherche a échoué (${res.status}). Vérifiez votre connexion et réessayez.`
        )
      }

      const data = (await res.json()) as unknown

      return this.normalizeResponse(data)
    } catch (err) {
      if (err instanceof SearchError) {
        throw err
      }
      throw new SearchError(
        "NETWORK_ERROR",
        "La recherche n'a pas pu aboutir. Vérifiez votre connexion et réessayez."
      )
    }
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
    const results: SearchResultItem[] = Array.isArray(raw.results)
      ? raw.results.map((item) => this.normalizeResultItem(item))
      : []

    const disponibiliteIds: string[] = Array.isArray(
      raw.disponibiliteIds
    )
      ? raw.disponibiliteIds.filter((id) => typeof id === "string")
      : []

    return {
      results,
      count: results.length,
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
    }
  }
}

export const searchService = new SearchService()
