/**
 * Source unique des marques de gaz proposées dans les outils de recherche.
 *
 * Les dix marques ci-dessous sont la liste officielle. Aucune autre valeur
 * n'est proposée à la sélection dans les formulaires de recherche.
 */
export const OFFICIAL_GAS_BRANDS = [
  "Tradex Gaz",
  "SCTM Gaz",
  "TotalEnergies",
  "Bocom",
  "Green Oil",
  "AfriGaz",
  "Neptune Gaz",
  "Ola Gaz",
  "MRS",
  "PleinGaz",
] as const

export type OfficialGasBrand = (typeof OFFICIAL_GAS_BRANDS)[number]

/** Libellé de l'option qui désactive le filtre marque. */
export const ALL_BRANDS_LABEL = "Toutes les marques"

/** Valeur envoyée au moteur de recherche quand aucune marque n'est filtrée. */
export const ALL_BRANDS_VALUE = ""

/** Clé de comparaison insensible à la casse et aux espaces superflus. */
export function normalizeGasBrandKey(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

/**
 * Anciennes dénominations encore présentes dans les disponibilités enregistrées.
 * Elles ne sont jamais proposées dans l'interface, mais permettent au moteur
 * de reconnaissance de continuer à retrouver les signalements existants.
 */
const LEGACY_BRAND_ALIASES: Record<string, OfficialGasBrand> = {
  tradex: "Tradex Gaz",
  "tradex gaz": "Tradex Gaz",
  sctm: "SCTM Gaz",
  "sctm gaz": "SCTM Gaz",
  total: "TotalEnergies",
  totalenergies: "TotalEnergies",
  bocom: "Bocom",
  "green oil": "Green Oil",
  afrigaz: "AfriGaz",
  "afri gaz": "AfriGaz",
  "neptune oil": "Neptune Gaz",
  neptune: "Neptune Gaz",
  "neptune gaz": "Neptune Gaz",
  "ola energy": "Ola Gaz",
  ola: "Ola Gaz",
  "ola gaz": "Ola Gaz",
  mrs: "MRS",
  pleingaz: "PleinGaz",
  "plein gaz": "PleinGaz",
}

/** Marque officielle exacte saisie, ou null si la saisie n'est pas exacte. */
export function exactOfficialBrand(value: string): OfficialGasBrand | null {
  const key = normalizeGasBrandKey(value)
  if (!key) return null
  return OFFICIAL_GAS_BRANDS.find((brand) => normalizeGasBrandKey(brand) === key) ?? null
}

/**
 * Résout une valeur vers une marque officielle, y compris pour les anciennes
 * dénominations enregistrées en base. Utilisé uniquement côté moteur.
 */
export function resolveOfficialGasBrand(
  value: string | null | undefined
): OfficialGasBrand | null {
  if (!value) return null
  const key = normalizeGasBrandKey(value)
  if (!key) return null
  if (LEGACY_BRAND_ALIASES[key]) return LEGACY_BRAND_ALIASES[key]
  return exactOfficialBrand(key)
}

/**
 * Comparaison entre la marque d'une disponibilité et le filtre choisi.
 * Une marque officielle reconnaît ses anciennes dénominations. Une valeur
 * non officielle conserve l'ancien comportement (égalité insensible à la
 * casse), afin de ne pas exclure les marques personnalisées déjà enregistrées.
 */
export function gasBrandMatches(
  availabilityBrand: string | null | undefined,
  selectedBrand: string | null | undefined
): boolean {
  if (!selectedBrand) return true
  const selected = resolveOfficialGasBrand(selectedBrand)
  if (selected) {
    return resolveOfficialGasBrand(availabilityBrand) === selected
  }
  return normalizeGasBrandKey(availabilityBrand ?? "") === normalizeGasBrandKey(selectedBrand)
}

/**
 * Suggestions commençant par la saisie, insensible aux majuscules.
 * Une saisie vide ne renvoie aucune marque : les dix marques ne sont jamais
 * affichées en une seule fois.
 */
export function suggestGasBrands(query: string): readonly OfficialGasBrand[] {
  const key = normalizeGasBrandKey(query)
  if (!key) return []
  return OFFICIAL_GAS_BRANDS.filter((brand) => normalizeGasBrandKey(brand).startsWith(key))
}
