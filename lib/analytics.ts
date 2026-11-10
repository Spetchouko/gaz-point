/**
 * Utilitaire de tracking first-party pour la mesure d'audience de GazPoints.
 *
 * Collecte uniquement des données non sensibles (routes, événements, appareil,
 * referrer host, paramètres UTM). Jamais de mots de passe, codes OTP ou
 * données personnelles.
 *
 * Le sessionId est généré une fois par session de navigation et stocké dans
 * localStorage. Il est réinitialisé à la fermeture de l'onglet/navigateur.
 */

const SESSION_STORAGE_KEY = "gz_analytics_session_id"
/* Clé alignée sur le ConsentBanner existant (gz_consent = "accepted"). */
const CONSENT_STORAGE_KEY = "gz_consent"

export type AnalyticsEventType =
  | "page_view"
  | "session_start"
  | "search_performed"
  | "search_results_viewed"
  | "signup_started"
  | "signup_completed"
  | "email_verified"
  | "seller_signup_completed"
  | "sales_point_created"
  | "availability_published"

export interface AnalyticsEventPayload {
  eventType: AnalyticsEventType
  path?: string
  referrer?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  userId?: string
  metadata?: Record<string, unknown>
}

let sessionId: string | null = null

/**
 * Récupère (ou crée) l'identifiant de session anonyme.
 * Stable durant l'onglet actuel, réinitialisé à la fermeture.
 */
function getOrCreateSessionId(): string {
  if (sessionId) return sessionId
  if (typeof window === "undefined") return ""
  let existing = localStorage.getItem(SESSION_STORAGE_KEY)
  if (!existing) {
    existing = crypto.randomUUID()
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, existing)
    } catch {
      // localStorage indisponible : session éphémère en mémoire
    }
  }
  sessionId = existing
  return sessionId
}

/**
 * Vérifie si l'utilisateur a consenti à la mesure d'audience.
 */
export function hasAnalyticsConsent(): boolean {
  if (typeof window === "undefined") return false
  try {
    return localStorage.getItem(CONSENT_STORAGE_KEY) === "accepted"
  } catch {
    return false
  }
}

/**
 * Enregistre le consentement de l'utilisateur.
 */
export function setAnalyticsConsent(value: boolean): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, value ? "accepted" : "rejected")
  } catch {
    // ignore
  }
}

/**
 * Extrait les paramètres UTM de l'URL actuelle.
 */
function getUtmParams(): {
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
} {
  if (typeof window === "undefined") return {}
  const params = new URLSearchParams(window.location.search)
  const utmSource = params.get("utm_source") || undefined
  const utmMedium = params.get("utm_medium") || undefined
  const utmCampaign = params.get("utm_campaign") || undefined
  return { utmSource, utmMedium, utmCampaign }
}

/**
 * Envoie un événement analytique à l'API serveur.
 * Échoue silencieusement en cas d'erreur (ne doit jamais bloquer l'utilisateur).
 */
export async function trackEvent(payload: AnalyticsEventPayload): Promise<void> {
  if (typeof window === "undefined") return
  if (!hasAnalyticsConsent()) return

  const sid = getOrCreateSessionId()
  const { utmSource, utmMedium, utmCampaign } = getUtmParams()

  const body: Record<string, unknown> = {
    eventType: payload.eventType,
    path: payload.path ?? window.location.pathname,
    referrer: payload.referrer ?? document.referrer ?? undefined,
    sessionId: sid,
    ...(utmSource ? { utmSource } : {}),
    ...(utmMedium ? { utmMedium } : {}),
    ...(utmCampaign ? { utmCampaign } : {}),
    ...(payload.userId ? { userId: payload.userId } : {}),
    ...(payload.metadata ? { metadata: payload.metadata } : {}),
  }

  try {
    await fetch("/api/analytics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    })
  } catch {
    // Échec silencieux : le tracking ne doit jamais perturber l'utilisateur
  }
}

/**
 * Initialise le suivi de session : enregistre session_start et page_view
 * lors du chargement de la page. À appeler depuis un composant client (useEffect).
 */
export function initAnalyticsTracking(): void {
  if (typeof window === "undefined") return
  if (!hasAnalyticsConsent()) return

  const sid = getOrCreateSessionId()

  // session_start une seule fois par session
  const started = sessionStorage.getItem("gz_analytics_session_started")
  if (!started) {
    sessionStorage.setItem("gz_analytics_session_started", "1")
    trackEvent({
      eventType: "session_start",
      path: window.location.pathname,
    })
  }

  // page_view à chaque chargement
  trackEvent({
    eventType: "page_view",
    path: window.location.pathname,
  })
}
