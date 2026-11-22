/**
 * État partagé de la fenêtre superposée des disponibilités.
 *
 * Une seule disponibilité peut être ouverte à la fois : l'état contient
 * l'identifiant sélectionné, l'étape affichée et les données saisies dans le
 * formulaire de réservation (conservées lors d'un retour aux détails).
 */

export const DISPONIBILITE_STEPS = ["details", "reservation", "confirmation"] as const

export type DisponibiliteOverlayStep = (typeof DISPONIBILITE_STEPS)[number]

export type DisponibiliteOverlayState = {
  disponibiliteId: string | null
  step: DisponibiliteOverlayStep
  /** Quantité choisie pour la réservation, transmise à l'API existante. */
  quantity: number
}

export const CLOSED_OVERLAY: DisponibiliteOverlayState = {
  disponibiliteId: null,
  step: "details",
  quantity: 1,
}

/** Quantité maximale acceptée par /api/reservation/create. */
export const MAX_RESERVATION_QUANTITY = 20

export function normalizeReservationQuantity(
  requested: number,
  availableQuantity: number | null
): number {
  const requestedQuantity = Number.isFinite(requested)
    ? Math.floor(requested)
    : 1
  const upperBound =
    availableQuantity == null
      ? MAX_RESERVATION_QUANTITY
      : Math.min(availableQuantity, MAX_RESERVATION_QUANTITY)
  return Math.min(
    Math.max(1, requestedQuantity),
    Math.max(1, upperBound)
  )
}

export function openDetails(
  state: DisponibiliteOverlayState,
  disponibiliteId: string
): DisponibiliteOverlayState {
  return {
    disponibiliteId,
    step: "details",
    quantity: 1,
  }
}

export function openReservation(
  state: DisponibiliteOverlayState,
  disponibiliteId: string,
  availableQuantity: number | null = null
): DisponibiliteOverlayState {
  return {
    disponibiliteId,
    step: "reservation",
    quantity: normalizeReservationQuantity(state.quantity, availableQuantity),
  }
}

export function setOverlayStep(
  state: DisponibiliteOverlayState,
  step: DisponibiliteOverlayStep
): DisponibiliteOverlayState {
  return state.disponibiliteId ? { ...state, step } : state
}

export function setReservationQuantity(
  state: DisponibiliteOverlayState,
  quantity: number,
  availableQuantity: number | null = null
): DisponibiliteOverlayState {
  return {
    ...state,
    quantity: normalizeReservationQuantity(quantity, availableQuantity),
  }
}

export function closeOverlay(): DisponibiliteOverlayState {
  return CLOSED_OVERLAY
}
