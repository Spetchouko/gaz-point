/**
 * Résultat standardisé pour les Server Actions.
 */
export interface ActionResult {
  ok: boolean
  message: string
  field?: string
}