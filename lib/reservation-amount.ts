/** Montant unitaire à régler directement au dépôt, en FCFA. */
export const RESERVATION_UNIT_AMOUNT = 1000

/**
 * Calcule le montant total à régler au dépôt.
 * Retourne `null` pour une quantité invalide afin que l'appelant puisse
 * refuser la réservation au lieu d'enregistrer un montant fictif.
 */
export function calculateReservationAmount(quantity: number): number | null {
  if (!Number.isInteger(quantity) || quantity < 1) return null
  return quantity * RESERVATION_UNIT_AMOUNT
}
