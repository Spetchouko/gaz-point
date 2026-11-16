/**
 * Source de vérité unique pour les formats/grammages de bouteilles GazPoints.
 *
 * Les 7 formats prédéfinis sont proposés dans les recherches et formulaires.
 * Les utilisateurs peuvent aussi saisir librement un autre grammage : ces
 * valeurs personnalisées doivent être acceptées, validées, stockées et
 * transmises au backend comme n'importe quelle autre valeur.
 */

export const PREDEFINED_BOTTLE_FORMATS = [
  "6 kg",
  "12,5 kg",
  "15 kg",
  "25 kg",
  "35 kg",
  "50 kg",
] as const

export type PredefinedBottleFormat = (typeof PREDEFINED_BOTTLE_FORMATS)[number]

export const MAX_BOTTLE_FORMAT_LENGTH = 50

export function normalizeBottleFormatValue(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim()
}

export function isPredefinedBottleFormat(
  value: string
): value is PredefinedBottleFormat {
  const normalized = normalizeBottleFormatValue(value)
  return PREDEFINED_BOTTLE_FORMATS.some(
    (format) => normalizeBottleFormatValue(format) === normalized
  )
}

/**
 * Nettoie une valeur de grammage saisie ou transmise.
 * Retourne null si la valeur est vide après nettoyage.
 */
export function sanitizeBottleFormat(value: string | null | undefined): string | null {
  if (value == null) return null
  const cleaned = value.replace(/\s+/g, " ").trim()
  if (!cleaned) return null
  return cleaned.slice(0, MAX_BOTTLE_FORMAT_LENGTH)
}

export function validateBottleFormat(value: string | null | undefined): {
  ok: true
  value: string | null
} | {
  ok: false
  message: string
} {
  const cleaned = sanitizeBottleFormat(value)
  if (!cleaned) return { ok: true, value: null }
  if (cleaned.length > MAX_BOTTLE_FORMAT_LENGTH) {
    return {
      ok: false,
      message: `Le grammage ne doit pas dépasser ${MAX_BOTTLE_FORMAT_LENGTH} caractères.`,
    }
  }
  return { ok: true, value: cleaned }
}
