import { PREDEFINED_BOTTLE_FORMATS } from "@/lib/bottle-formats"

export const MAX_VENDOR_BRANDS = 30
export const MAX_VENDOR_FORMATS = 30

/**
 * Marques de gaz domestique comercialisées au Cameroun.
 *
 * La liste couvre les marques nationales et les distributeurs actuellement
 * visibles sur le marché camerounais. Une marque absente reste possible via
 * la saisie « Autre marque ».
 */
export const CAMEROON_GAS_BRANDS = [
  "TotalEnergies",
  "Camgaz",
  "Afrigaz",
  "Glocal Gaz",
  "Tradex",
  "Bocom",
  "Neptune Oil",
  "SCTM",
  "Blessing",
  "MRS",
  "OLA Energy",
  "Green Oil",
  "Tank Oil",
  "Afrique Gas",
  "Afrique Gaz",
  "Glencore",
  "Gulf",
  "NP Gas",
  "Oryx",
  "Petrolex",
  "Sahara",
  "SCDP",
  "SPM",
  "Total",
] as const

/**
 * Grammages prédéfinis proposés dans les formulaires vendeurs/admin.
 * Les formulaires acceptent aussi un format personnalisé.
 */
export const GAS_BOTTLE_FORMATS = PREDEFINED_BOTTLE_FORMATS

export function normalizeCatalogValue(value: string): string {
  return value.trim().toLowerCase()
}

export function cleanCatalogValues(
  values: unknown,
  max: number
): string[] {
  if (!Array.isArray(values)) return []

  const seen = new Set<string>()
  const cleaned: string[] = []

  for (const value of values) {
    if (typeof value !== "string") continue
    const trimmed = value.trim()
    if (!trimmed) continue

    const key = normalizeCatalogValue(trimmed)
    if (seen.has(key)) continue
    seen.add(key)
    cleaned.push(trimmed)

    if (cleaned.length >= max) break
  }

  return cleaned
}

export function catalogValueIsSelected(
  values: string[],
  candidate: string
): boolean {
  const candidateKey = normalizeCatalogValue(candidate)
  return values.some((value) => normalizeCatalogValue(value) === candidateKey)
}
