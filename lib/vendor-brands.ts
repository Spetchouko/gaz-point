/**
 * Utilitaires pour la gestion des marques de bouteilles (vendors).
 * Utilisés par BrandListInput et la validation d'inscription vendeur.
 */

export const MIN_VENDOR_BRANDS = 1
export const MAX_VENDOR_BRANDS = 5

/**
 * Normalise une marque pour la comparaison (insensible à la casse, trim).
 */
export function brandKey(brand: string): string {
  return brand.trim().toLowerCase()
}

/**
 * Déduplique une liste de marques (insensible à la casse).
 * Conserve la première occurrence (sa graphie d'origine).
 */
export function dedupeBrands(brands: string[]): string[] {
  const seen = new Set<string>()
  return brands.filter((brand) => {
    const key = brandKey(brand)
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}