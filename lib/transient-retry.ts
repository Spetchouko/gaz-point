/**
 * Relance des opérations serveur sur les erreurs TRANSITOIRES uniquement.
 *
 * Le driver Neon (`@neondatabase/serverless`) passe par HTTP : une requête
 * peut échouer ponctuellement (`TypeError: fetch failed`, coupure, limite de
 * débit). Ces erreurs sont indistinguables d'une session absente côté appelant
 * (`getCurrentUser()` retourne `null` → redirection vers `/connexion`), ce qui
 * déconnectait arbitrairement un vendeur connecté.
 *
 * On retente donc quelques fois, avec un court délai, mais UNIQUEMENT quand
 * l'erreur est bien transitoire : une erreur métier (colonne inconnue, contrainte
 * violée, requête malformée) est remontée immédiatement pour ne pas masquer
 * un vrai bug.
 */

/** Marqueurs d'erreur réseau/transitoire (recherchés dans toute la chaîne `cause`). */
const TRANSIENT_MARKERS = [
  "fetch failed",
  "fetch error",
  "network error",
  "econnreset",
  "econnrefused",
  "etimedout",
  "epipe",
  "socket hang up",
  "other side closed",
  "und_err",
  "getaddrinfo",
  "premature close",
  "request timeout",
  "timed out",
  "too many requests",
  "rate limit",
  "bad gateway",
  "service unavailable",
  "gateway timeout",
  "other side closed",
] as const

/** Collecte le message d'une erreur et de ses causes imbriquées. */
function describeErrorChain(error: unknown): string {
  const messages: string[] = []
  let current: unknown = error
  let depth = 0

  while (current instanceof Error && depth < 6) {
    messages.push(`${current.name}: ${current.message}`.toLowerCase())
    current = (current as { cause?: unknown }).cause
    depth++
  }

  return messages.join("\n")
}

/** Vrai si l'erreur correspond à une panne réseau/infra transitoire. */
export function isTransientError(error: unknown): boolean {
  if (!(error instanceof Error)) return false
  const description = describeErrorChain(error)
  return TRANSIENT_MARKERS.some((marker) => description.includes(marker))
}

export type TransientRetryOptions = {
  /** Nombre total d'essais (défaut : 3). */
  attempts?: number
  /** Délai de base entre deux essais, multiplié par le numéro d'essai. */
  delayMs?: number
}

/**
 * Exécute `operation` et la retente sur les erreurs transitoires.
 *
 * Les erreurs non transitoires sont remontées au premier essai.
 * Les redirections Next.js (`NEXT_REDIRECT`) ne sont jamais retentées.
 */
export async function withTransientRetry<T>(
  operation: () => Promise<T>,
  options: TransientRetryOptions = {}
): Promise<T> {
  const attempts = Math.max(1, options.attempts ?? 3)
  const delayMs = options.delayMs ?? 250

  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      // Une redirection n'est pas une erreur : on la laisse traverser.
      if (isNextRedirect(error)) throw error
      if (!isTransientError(error) || attempt === attempts) throw error

      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt))
    }
  }

  throw lastError ?? new Error("withTransientRetry : aucun essai exécuté")
}

function isNextRedirect(error: unknown): boolean {
  return (
    error instanceof Error &&
    (error.message.includes("NEXT_REDIRECT") ||
      (error as { digest?: unknown }).digest?.toString().startsWith("NEXT_REDIRECT") === true)
  )
}
