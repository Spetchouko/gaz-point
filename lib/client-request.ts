export const CLIENT_REQUEST_TIMEOUT_MS = 15_000

export type ClientRequestErrorKind =
  | "http"
  | "network"
  | "timeout"
  | "aborted"
  | "invalid_json"

export class ClientRequestError extends Error {
  readonly status: number | null
  readonly kind: ClientRequestErrorKind

  constructor(
    message: string,
    options: { status?: number | null; kind: ClientRequestErrorKind }
  ) {
    super(message)
    this.name = "ClientRequestError"
    this.status = options.status ?? null
    this.kind = options.kind
  }
}

type RequestJsonOptions = {
  timeoutMs?: number
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  )
}

function getErrorMessage(payload: unknown, status: number): string {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof (payload as { error?: unknown }).error === "string"
  ) {
    return (payload as { error: string }).error
  }

  return `La requête a échoué (${status}). Réessayez.`
}

/**
 * Exécute une requête JSON côté client avec un délai d'attente maximal.
 * Les réponses obsolètes peuvent être annulées avec le signal fourni.
 */
export async function requestJson<T>(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: RequestJsonOptions = {}
): Promise<T> {
  const timeoutMs = options.timeoutMs ?? CLIENT_REQUEST_TIMEOUT_MS
  const controller = new AbortController()
  const externalSignal = init.signal
  let didTimeout = false

  const timeout = setTimeout(() => {
    didTimeout = true
    controller.abort()
  }, timeoutMs)

  const abortFromExternalSignal = () => controller.abort()
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort()
    } else {
      externalSignal.addEventListener("abort", abortFromExternalSignal, {
        once: true,
      })
    }
  }

  try {
    const response = await fetch(input, {
      ...init,
      signal: controller.signal,
    })

    const payload = await response.json().catch(() => null)

    if (!response.ok) {
      throw new ClientRequestError(getErrorMessage(payload, response.status), {
        status: response.status,
        kind: "http",
      })
    }

    if (response.status === 204) {
      return undefined as T
    }

    if (payload === null) {
      throw new ClientRequestError("La réponse du serveur est invalide.", {
        status: response.status,
        kind: "invalid_json",
      })
    }

    return payload as T
  } catch (error) {
    if (error instanceof ClientRequestError) {
      throw error
    }

    if (didTimeout) {
      throw new ClientRequestError(
        "Le serveur met trop de temps à répondre. Réessayez.",
        { kind: "timeout" }
      )
    }

    if (externalSignal?.aborted || isAbortError(error)) {
      throw new ClientRequestError("La requête a été annulée.", {
        kind: "aborted",
      })
    }

    throw new ClientRequestError(
      "Impossible de joindre le serveur. Vérifiez votre connexion et réessayez.",
      { kind: "network" }
    )
  } finally {
    clearTimeout(timeout)
    externalSignal?.removeEventListener("abort", abortFromExternalSignal)
  }
}

export function isUnauthenticatedRequest(error: unknown): boolean {
  return (
    error instanceof ClientRequestError &&
    error.kind === "http" &&
    error.status === 401
  )
}
