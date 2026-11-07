// Types et constantes partagés entre le serveur et les composants client.
// Aucun import base de données ici : ce fichier est sûr côté client.

export const AVIS_STATUSES = ["pending", "approved", "rejected", "hidden"] as const
export type AvisStatus = (typeof AVIS_STATUSES)[number]

export const AVIS_STATUS_LABELS: Record<AvisStatus, string> = {
  pending: "En attente",
  approved: "Approuvé",
  rejected: "Refusé",
  hidden: "Masqué",
}

export type AvisType = "particulier" | "vendeur"

/** Avis public affiché sur la landing (aucune donnée privée). */
export type AvisPublic = {
  id: string
  name: string
  city: string | null
  quote: string
  type: AvisType
  avatarUrl: string | null
}

/** Le rôle réel (serveur) de l'auteur → type affiché. */
export function avisTypeFromRole(role: string | null | undefined): AvisType {
  return role === "vendor" ? "vendeur" : "particulier"
}

/** Normalise une valeur de statut quelconque vers un statut connu. */
export function toAvisStatus(value: string | null | undefined): AvisStatus {
  return AVIS_STATUSES.includes(value as AvisStatus)
    ? (value as AvisStatus)
    : "pending"
}
