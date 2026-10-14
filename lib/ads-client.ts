/**
 * Suivi publicitaire côté navigateur.
 *
 * - Respecte le consentement : rien n'est envoyé si `gz_consent !== "accepted"`.
 * - Aucun identifiant personnel : `visitorId` / `sessionId` sont aléatoires et
 *   ne sont jamais reliés à l'utilisateur connecté.
 * - Une impression n'est comptée qu'une fois par publicité et par jour
 *   (garde locale) ; le serveur applique la même unicité.
 */
import {
  IMPRESSION_MIN_VISIBLE_MS,
  IMPRESSION_VISIBLE_RATIO,
} from "@/lib/publicite-analytics"

export const CONSENT_KEY = "gz_consent"
export const CONSENT_EVENT = "gz-consent-change"

const VISITOR_KEY = "gz_visitor_id"
const SESSION_KEY = "gz_session_id"
const IMPRESSION_PREFIX = "gz_imp_"

function randomId(): string {
  try {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      return crypto.randomUUID()
    }
  } catch {
    // ignore
  }
  return `r${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`
}

export function isTrackingConsented(): boolean {
  if (typeof window === "undefined") return false
  try {
    return window.localStorage.getItem(CONSENT_KEY) === "accepted"
  } catch {
    return false
  }
}

function storageGet(store: Storage, key: string): string {
  try {
    const existing = store.getItem(key)
    if (existing) return existing
    const created = randomId()
    store.setItem(key, created)
    return created
  } catch {
    return randomId()
  }
}

export function getVisitorId(): string {
  if (typeof window === "undefined") return randomId()
  return storageGet(window.localStorage, VISITOR_KEY)
}

export function getSessionId(): string {
  if (typeof window === "undefined") return randomId()
  return storageGet(window.sessionStorage, SESSION_KEY)
}

function utmValue(name: string): string | null {
  try {
    return new URL(window.location.href).searchParams.get(name)
  } catch {
    return null
  }
}

/** Referrer externe uniquement (une navigation interne n'est pas une source). */
function externalReferrer(): string | null {
  if (typeof document === "undefined" || !document.referrer) return null
  try {
    const host = new URL(document.referrer).hostname
    if (host && host === window.location.hostname) return null
    return document.referrer
  } catch {
    return null
  }
}

function impressionEventKey(publiciteId: string, visitorId: string): string {
  const d = new Date()
  const day = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`
  return `imp:${publiciteId}:${visitorId}:${day}`
}

function hasCountedImpression(eventKey: string): boolean {
  try {
    return window.localStorage.getItem(`${IMPRESSION_PREFIX}${eventKey}`) === "1"
  } catch {
    return false
  }
}

function markImpressionCounted(eventKey: string): void {
  try {
    window.localStorage.setItem(`${IMPRESSION_PREFIX}${eventKey}`, "1")
  } catch {
    // ignore
  }
}

function postEvent(payload: {
  publiciteId: string
  eventType: "impression" | "click"
  eventKey: string
}): void {
  if (!isTrackingConsented()) return
  try {
    const visitorId = getVisitorId()
    void fetch("/api/ads/event", {
      method: "POST",
      headers: { "content-type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        publiciteId: payload.publiciteId,
        eventType: payload.eventType,
        eventKey: payload.eventKey,
        visitorId,
        sessionId: getSessionId(),
        path: window.location.pathname,
        referrer: externalReferrer(),
        utmSource: utmValue("utm_source"),
        utmMedium: utmValue("utm_medium"),
        utmCampaign: utmValue("utm_campaign"),
        consented: true,
      }),
    }).catch(() => {})
  } catch {
    // ignore
  }
}

/** Compte une impression (au plus une fois par publicité et par jour). */
export function sendImpressionEvent(publiciteId: string): void {
  if (!isTrackingConsented()) return
  const key = impressionEventKey(publiciteId, getVisitorId())
  if (hasCountedImpression(key)) return
  markImpressionCounted(key)
  postEvent({ publiciteId, eventType: "impression", eventKey: key })
}

/** Compte un clic (une clé unique par clic réel, anti-doublon réseau). */
export function sendClickEvent(publiciteId: string): void {
  if (!isTrackingConsented()) return
  postEvent({
    publiciteId,
    eventType: "click",
    eventKey: `clk:${publiciteId}:${randomId()}`,
  })
}

export { IMPRESSION_MIN_VISIBLE_MS, IMPRESSION_VISIBLE_RATIO }
