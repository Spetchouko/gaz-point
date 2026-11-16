/**
 * Extrait un message d'erreur court et exploitable.
 *
 * Drizzle enveloppe les erreurs du driver dans `DrizzleQueryError` et expose la
 * requête SQL complète dans `message`. Pour les logs applicatifs, on préfère le
 * message de la cause réelle (Neon, réseau, etc.) afin de ne pas polluer la
 * console avec du SQL et des paramètres.
 */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) {
    const cause = (error as Error & { cause?: unknown }).cause
    if (cause instanceof Error && cause.message) return cause.message
    if (typeof cause === "string" && cause.trim()) return cause
    return error.message
  }
  return String(error)
}
