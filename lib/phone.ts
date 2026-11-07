/**
 * Utilitaires de normalisation des numéros de téléphone camerounais.
 * Code pur (sans React) utilisable côté client et côté serveur.
 */

/** Indicatif international du Cameroun. */
export const COUNTRY_CODE = "+237"

/** Nombre de chiffres attendus après l'indicatif (numéro national sans +237). */
export const NATIONAL_NUMBER_LENGTH = 9

/**
 * Extrait les chiffres nationaux d'un numéro de téléphone stocké.
 *
 * Accepte :
 *  - "+237XXXXXXXXX" (format canonique stocké)
 *  - "237XXXXXXXXX" (sans le +)
 *  - "690123456" (9 chiffres nationaux purs)
 *
 * Rejette (retourne "") toute autre longueur (8 ou 10 chiffres, etc.).
 *
 * Retourne les 9 chiffres nationaux, ou une chaîne vide si invalide.
 */
export function extractNationalDigits(value: string | null | undefined): string {
  if (!value) return ""
  const digits = value.replace(/\D/g, "")
  if (digits.startsWith("237") && digits.length === NATIONAL_NUMBER_LENGTH + 3) {
    return digits.slice(-NATIONAL_NUMBER_LENGTH)
  }
  // Ancien format national avec trunkage : "0XXXXXXXXX" (10 chiffres, premier = 0)
  if (digits.length === 10 && digits.startsWith("0")) {
    return digits.slice(-NATIONAL_NUMBER_LENGTH)
  }
  if (digits.length === NATIONAL_NUMBER_LENGTH) {
    return digits
  }
  return ""
}

/**
 * Normalise un numéro au format canonique +237XXXXXXXXX.
 *
 * - Évite les doublons d'indicatif (+237+237...).
 * - Retourne null si vide ou pas assez de chiffres.
 */
export function normalizePhone(value: string | null | undefined): string | null {
  if (!value) return null
  const national = extractNationalDigits(value)
  if (national.length !== NATIONAL_NUMBER_LENGTH) return null
  return `${COUNTRY_CODE}${national}`
}

/**
 * Valide qu'une chaîne contient exactement 9 chiffres nationaux.
 */
export function isValidNationalNumber(value: string): boolean {
  return /^\d{9}$/.test(value)
}
