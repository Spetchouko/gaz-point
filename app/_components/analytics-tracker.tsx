"use client"

import { useEffect } from "react"
import { trackEvent } from "@/lib/analytics"

/**
 * Composant de suivi automatique de session.
 * Envoie un événement `session_start` une fois par session de navigation.
 * Le `page_view` est déjà géré par le ConsentBanner (consentement requis).
 */
export function AnalyticsTracker() {
  useEffect(() => {
    const started = sessionStorage.getItem("gz_analytics_session_started")
    if (!started) {
      sessionStorage.setItem("gz_analytics_session_started", "1")
      trackEvent({ eventType: "session_start" })
    }
  }, [])

  return null
}
