// Types et constantes partagés entre le serveur et les composants client.
// Aucun import base de données ici : ce fichier est sûr côté client.

export const AVIS_STATUSES = ["pending", "approved", "rejected", "hidden"] as const
export type AvisStatus = (typeof AVIS_STATUSES)[number]

export const AVIS_STATUS_LABELS: Record<AvisStatus, string> = {
  pending: "En attente",
  approved: "Validé",
  rejected: "Refusé",
  hidden: "Masqué",
}

export type AvisType = "client" | "vendeur"

export const AVIS_RATING_MIN = 1
export const AVIS_RATING_MAX = 5

/** Avis public affiché sur la landing (aucune donnée privée). */
export type AvisPublic = {
  id: string
  name: string
  city: string | null
  quote: string
  rating: number | null
  type: AvisType
  avatarUrl: string | null
}

/** Avis de l'utilisateur connecté, avec son statut de modération. */
export type AvisMine = {
  id: string
  rating: number | null
  quote: string
  status: AvisStatus
  createdAt: string
  updatedAt: string
}

/** Le rôle réel (serveur) de l'auteur → type affiché. */
export function avisTypeFromRole(role: string | null | undefined): AvisType {
  return role === "vendor" ? "vendeur" : "client"
}

/** Libellé public du type d'auteur. */
export function avisTypeLabel(type: AvisType): string {
  return type === "vendeur" ? "Vendeur" : "Client"
}

/** Seul le prénom est affiché publiquement. */
export function avisFirstName(name: string): string {
  return name.trim().split(/\s+/)[0] || "Utilisateur"
}

/** Normalise une valeur de statut quelconque vers un statut connu. */
export function toAvisStatus(value: string | null | undefined): AvisStatus {
  return AVIS_STATUSES.includes(value as AvisStatus)
    ? (value as AvisStatus)
    : "pending"
}
