"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { Cookie, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CONSENT_EVENT } from "@/lib/ads-client"

const KEY = "gz_consent"

function utmValue(name: string): string | null {
  try {
    return new URL(window.location.href).searchParams.get(name)
  } catch {
    return null
  }
}

function sendPageview(path: string) {
  const referrer = typeof document !== "undefined" ? document.referrer : ""
  fetch("/api/traffic", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      path,
      referrer: referrer || null,
      utmSource: utmValue("utm_source"),
      utmMedium: utmValue("utm_medium"),
      utmCampaign: utmValue("utm_campaign"),
    }),
  }).catch(() => {})
}

let lastSentPath = ""

export function ConsentBanner() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)
  const [accepted, setAccepted] = useState<boolean | null>(null)

  useEffect(() => {
    let cancelled = false
    const timer = setTimeout(() => {
      const stored = localStorage.getItem(KEY)
      if (cancelled) return
      if (stored === "accepted") {
        setAccepted(true)
      } else if (stored === "rejected") {
        setAccepted(false)
      } else {
        setShow(true)
      }
    }, 0)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  useEffect(() => {
    if (!accepted) return
    if (lastSentPath === pathname) return
    lastSentPath = pathname
    sendPageview(pathname)
  }, [pathname, accepted])

  const accept = () => {
    localStorage.setItem(KEY, "accepted")
    setAccepted(true)
    setShow(false)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CONSENT_EVENT))
    }
    if (lastSentPath !== pathname) {
      lastSentPath = pathname
      sendPageview(pathname)
    }
  }

  const refuse = () => {
    localStorage.setItem(KEY, "rejected")
    setAccepted(false)
    setShow(false)
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event(CONSENT_EVENT))
    }
  }

  if (!show) return null

  return (
    <div
      role="region"
      aria-label="Consentement au suivi d'audience"
      className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 rounded-xl border bg-card/95 p-4 shadow-lg backdrop-blur sm:p-5"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Cookie className="size-4 text-primary" />
        </div>
        <div className="flex-1 space-y-1">
          <p className="text-sm font-semibold">Gestion du suivi d&apos;audience</p>
          <p className="text-sm text-muted-foreground">
            Nous mesurons anonymement le trafic (pages visitées, inscriptions) et la
            performance des publicités (impressions, clics, conversions) pour améliorer
            GazPoints. Aucune donnée personnelle n&apos;est transmise. En cas de clic sur une
            publicité, un identifiant anonyme et un cookie publicitaire (gz_ad_ref, 30 jours)
            servent uniquement à mesurer son efficacité.
          </p>
        </div>
        <button
          type="button"
          onClick={refuse}
          aria-label="Fermer sans consentir"
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        <Button variant="ghost" size="sm" onClick={refuse}>
          Refuser
        </Button>
        <Button size="sm" onClick={accept}>
          Accepter
        </Button>
      </div>
    </div>
  )
}