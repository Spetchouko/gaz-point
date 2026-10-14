/**
 * Configuration partagée des publicités GazPoints.
 *
 * Ce module est volontairement sans dépendance serveur : il est importé à la
 * fois par les Server Actions (validation) et par les composants client
 * (formulaire, aperçus). Les emplacements, les statuts et les limites y sont
 * définis une seule fois pour éviter toute divergence.
 */

/**
 * Emplacements réellement affichés sur la landing page.
 * L'historique « apropos » est retiré : plus proposé, plus affiché.
 */
export const PUBLICITE_SLOTS = [
  {
    value: "home_hero",
    label: "Accueil — sous la bannière d'accueil",
    short: "Sous la bannière d'accueil",
    hint: "Juste sous la section d'accueil, en haut de la page.",
  },
  {
    value: "home_search",
    label: "Accueil — au-dessus de « Trouver mon Gaz »",
    short: "Au-dessus de « Trouver mon Gaz »",
    hint: "Juste avant la recherche de points de vente.",
  },
] as const

export type PubliciteSlot = (typeof PUBLICITE_SLOTS)[number]["value"]

export const PUBLICITE_SLOT_VALUES: readonly string[] = PUBLICITE_SLOTS.map(
  (slot) => slot.value
)

/** Anciens emplacements conservés en base mais plus jamais affichés. */
const LEGACY_SLOT_LABELS: Record<string, string> = {
  apropos: "À propos (emplacement retiré)",
}

export function isPubliciteSlot(value: string): value is PubliciteSlot {
  return PUBLICITE_SLOT_VALUES.includes(value)
}

export function publiciteSlotLabel(value: string): string {
  const slot = PUBLICITE_SLOTS.find((item) => item.value === value)
  return slot?.label ?? LEGACY_SLOT_LABELS[value] ?? value
}

export function publiciteSlotShort(value: string): string {
  const slot = PUBLICITE_SLOTS.find((item) => item.value === value)
  return slot?.short ?? LEGACY_SLOT_LABELS[value] ?? value
}

/* ------------------------------- Statuts ------------------------------- */

export const PUBLICITE_STATUSES = [
  "draft",
  "scheduled",
  "active",
  "expired",
  "suspended",
] as const

export type PubliciteStatus = (typeof PUBLICITE_STATUSES)[number]

export const PUBLICITE_STATUS_LABELS: Record<PubliciteStatus, string> = {
  draft: "Brouillon",
  scheduled: "Programmée",
  active: "En cours",
  expired: "Terminée",
  suspended: "Suspendue",
}

export function isPubliciteStatus(value: string): value is PubliciteStatus {
  return (PUBLICITE_STATUSES as readonly string[]).includes(value)
}

/**
 * Statut déduit des dates de diffusion.
 * `startAt` null = dès que possible, `endAt` null = sans limite.
 * Même règle que la Server Action, partagée pour l'aperçu du formulaire.
 */
export function derivePubliciteStatus(
  startAt: Date | string | null,
  endAt: Date | string | null,
  now: Date = new Date()
): PubliciteStatus {
  const startMs = startAt ? new Date(startAt).getTime() : 0
  const endMs = endAt ? new Date(endAt).getTime() : 0
  const nowMs = now.getTime()

  if (startMs > nowMs) return "scheduled"
  if (endMs > 0 && endMs <= nowMs) return "expired"
  if (startMs <= nowMs && (endMs === 0 || endMs > nowMs)) return "active"
  return "draft"
}

/* ------------------------------- Limites ------------------------------- */

export const PUBLICITE_TITLE_MAX = 60
export const PUBLICITE_DESCRIPTION_MAX = 160
export const PUBLICITE_IMAGE_MAX_BYTES = 5 * 1024 * 1024

export const PUBLICITE_ACCEPTED_MIME: readonly string[] = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/gif",
]

export const PUBLICITE_ACCEPT_ATTRIBUTE = PUBLICITE_ACCEPTED_MIME.join(",")

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 o"
  if (bytes < 1024) return `${Math.round(bytes)} o`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} Ko`
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`
}

/**
 * Indique si une valeur d'image est réellement affichable (data-URL ou URL).
 * Les anciennes valeurs texte invalides ne sont jamais rendues.
 */
export function isPubliciteImageUrl(value: string | null | undefined): boolean {
  const trimmed = (value ?? "").trim()
  if (!trimmed) return false
  if (/^data:image\//i.test(trimmed)) return true
  return /^https?:\/\//i.test(trimmed)
}

/* ---------------------------- Validation ------------------------------- */

export function validatePubliciteTitle(raw: string): string | null {
  const title = raw.trim()
  if (!title) return "Le titre est requis."
  if (title.length > PUBLICITE_TITLE_MAX) {
    return `Le titre ne doit pas dépasser ${PUBLICITE_TITLE_MAX} caractères (${title.length} actuellement).`
  }
  return null
}

export function validatePubliciteDescription(raw: string): string | null {
  const description = raw.trim()
  if (description.length > PUBLICITE_DESCRIPTION_MAX) {
    return `La description ne doit pas dépasser ${PUBLICITE_DESCRIPTION_MAX} caractères (${description.length} actuellement).`
  }
  return null
}

export type PubliciteImageValidation =
  | { ok: true; value: string | null }
  | { ok: false; error: string }

/**
 * Valide la valeur d'image telle qu'enregistrée en base.
 * - data-URL d'image : le poids réel décodé est vérifié (≤ 5 Mo) ;
 * - URL http(s) : acceptée telle quelle ;
 * - toute autre valeur (ex. l'ancien texte « (image téléchargée) ») est
 *   neutralisée : l'image est retirée plutôt que d'afficher un visuel cassé.
 */
export function validatePubliciteImage(
  raw: string | null | undefined
): PubliciteImageValidation {
  const value = (raw ?? "").trim()
  if (!value) return { ok: true, value: null }

  const dataUrl = value.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i)
  if (dataUrl) {
    const mime = dataUrl[1].toLowerCase()
    if (!PUBLICITE_ACCEPTED_MIME.includes(mime)) {
      return {
        ok: false,
        error: `Format d'image non pris en charge (${mime}). Utilisez PNG, JPEG, WebP, AVIF ou GIF.`,
      }
    }
    const base64 = dataUrl[2].replace(/\s/g, "")
    const bytes = Math.floor((base64.length * 3) / 4)
    if (bytes > PUBLICITE_IMAGE_MAX_BYTES) {
      return {
        ok: false,
        error: `L'image dépasse la limite de 5 Mo (${formatBytes(bytes)}).`,
      }
    }
    return { ok: true, value }
  }

  if (/^https?:\/\//i.test(value)) {
    return { ok: true, value }
  }

  // data-URL non image (ex. data:application/pdf) : refusé explicitement.
  if (/^data:/i.test(value)) {
    return {
      ok: false,
      error:
        "Format d'image non pris en charge. Utilisez PNG, JPEG, WebP, AVIF ou GIF.",
    }
  }

  // Valeur historique invalide (ex. texte « (image téléchargée) ») : neutralisée.
  return { ok: true, value: null }
}
