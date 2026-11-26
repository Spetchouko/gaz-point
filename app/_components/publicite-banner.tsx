"use client"

import { useEffect, useRef, useState, useCallback } from "react"
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  IMPRESSION_MIN_VISIBLE_MS,
  IMPRESSION_VISIBLE_RATIO,
  sendClickEvent,
  sendImpressionEvent,
} from "@/lib/ads-client"

export type PubliciteBannerData = {
  id: string
  title: string
  description: string | null
  image: string | null
  price: number | null
  priceLabel: string | null
  location: string | null
  phone: string | null
  linkUrl: string | null
  startAt: Date | string | null
  endAt: Date | string | null
  status: string
  duration: number | null
  priority: number
  displayOrder: number
}

const DEFAULT_DURATION = 8000 // 8 secondes par défaut
const MIN_DURATION = 5000
const MAX_DURATION = 30000

/**
 * Pubs éligibles : statut actif ET diffusion en cours (période [startAt, endAt]).
 * Même règle que la version précédente — on respecte le statut et les dates
 * de diffusion du système marketing existant.
 */
function getEligiblePublicites(ads: PubliciteBannerData[]): PubliciteBannerData[] {
  const now = new Date()

  return ads.filter((ad) => {
    if (ad.status !== "active") return false

    const startMs = ad.startAt ? new Date(ad.startAt).getTime() : 0
    const endMs = ad.endAt ? new Date(ad.endAt).getTime() : Infinity

    return now.getTime() >= startMs && now.getTime() <= endMs
  })
}

/**
 * Précharge une image (data-URL ou URL) pour éviter le clignotement au changement.
 */
function preloadImage(src: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new Image()
    img.onload = img.onerror = () => resolve()
    img.src = src
  })
}

/**
 * Carte unique d'une publicité.
 * Rendu partagé entre la landing page et les aperçus du dashboard Marketing :
 * image compacte à gauche, titre + texte court + bouton d'action à droite.
 * `interactive={false}` fige le bouton (aperçu non cliquable).
 */
export function PubliciteBannerCard({
  ad,
  interactive = true,
  animate = true,
  className,
  onImageError,
}: {
  ad: PubliciteBannerData
  interactive?: boolean
  animate?: boolean
  className?: string
  onImageError?: () => void
}) {
  const cardRef = useRef<HTMLElement | null>(null)
  const impressionCounted = useRef(false)
  const [imageError, setImageError] = useState(false)

  // Impression : comptée seulement si la bannière est réellement visible
  // (≥ 50 % de la surface pendant ≥ 1 s), une seule fois par publicité.
  useEffect(() => {
    if (!interactive) return
    if (typeof IntersectionObserver === "undefined") return
    const element = cardRef.current
    if (!element) return

    let timer: ReturnType<typeof setTimeout> | null = null
    const clearTimer = () => {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (impressionCounted.current) continue
          if (entry.isIntersecting && entry.intersectionRatio >= IMPRESSION_VISIBLE_RATIO) {
            if (!timer) {
              timer = setTimeout(() => {
                timer = null
                impressionCounted.current = true
                sendImpressionEvent(ad.id)
              }, IMPRESSION_MIN_VISIBLE_MS)
            }
          } else {
            clearTimer()
          }
        }
      },
      { threshold: [0, IMPRESSION_VISIBLE_RATIO, 1] }
    )

    observer.observe(element)
    return () => {
      clearTimer()
      observer.disconnect()
    }
  }, [ad.id, interactive])

  const handleClick = () => {
    if (interactive) sendClickEvent(ad.id)
  }

  const handleImgError = () => {
    setImageError(true)
    onImageError?.()
  }

  return (
    <article
      ref={cardRef}
      className={cn(
        "flex h-auto w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm md:h-[200px] md:flex-row",
        animate && "animate-in fade-in duration-500 motion-reduce:animate-none",
        className
      )}
    >
      {/* Zone image (gauche) */}
      {ad.image && !imageError && (
        <div
          className={cn(
            "relative h-44 w-full shrink-0 overflow-hidden border-b border-border bg-muted md:h-full md:w-[38%] md:border-b-0 md:border-r border-border",
            animate &&
              "animate-in slide-in-from-right-8 fade-in duration-500 ease-out motion-reduce:animate-none"
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.image}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover"
            onError={handleImgError}
          />
        </div>
      )}

      {/* Zone contenu (droite) : titre + texte court + bouton d'action */}
      <div className="flex flex-1 flex-col justify-center gap-1.5 p-4 sm:p-5 md:gap-2">
        <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
          {ad.title || "GazPoints"}
        </h2>

        {(ad.price !== null || ad.priceLabel) && (
          <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {ad.priceLabel ??
              (ad.price !== null
                ? `${new Intl.NumberFormat("fr-FR").format(ad.price)} FCFA`
                : "")}
          </span>
        )}

        {ad.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {ad.description}
          </p>
        )}

        {ad.linkUrl &&
          (interactive ? (
            <a
              href={ad.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={handleClick}
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              En savoir plus
              <ArrowRight className="size-4" />
            </a>
          ) : (
            <span className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground">
              En savoir plus
              <ArrowRight className="size-4" />
            </span>
          ))}
      </div>
    </article>
  )
}

/**
 * Aperçu contextuel d'une publicité à un emplacement donné.
 * Reproduit le positionnement réel sur la landing : un repère gris figure la
 * section voisine (au-dessus pour « sous la bannière », en dessous pour
 * « au-dessus de Trouver mon Gaz »).
 */
export function PublicitePreview({
  ad,
  slot,
  className,
}: {
  ad: PubliciteBannerData
  slot: string
  className?: string
}) {
  const aboveSearch = slot === "home_search"

  return (
    <div className={cn("space-y-2 rounded-xl border bg-muted/30 p-3", className)}>
      {aboveSearch ? (
        <PreviewBar label="Sections de la page…" subtle />
      ) : (
        <PreviewBar label="Section d'accueil (Hero)" />
      )}

      <div className="mx-auto w-full max-w-[800px]">
        <PubliciteBannerCard ad={ad} interactive={false} animate={false} />
      </div>

      {aboveSearch ? (
        <PreviewBar label="« Trouver mon Gaz » — recherche" />
      ) : (
        <PreviewBar label="Suite de la page…" subtle />
      )}
    </div>
  )
}

function PreviewBar({ label, subtle = false }: { label: string; subtle?: boolean }) {
  return (
    <div
      className={cn(
        "flex h-9 items-center justify-center rounded-lg border border-dashed text-[11px] font-medium uppercase tracking-wide text-muted-foreground",
        subtle ? "bg-background/60" : "bg-muted"
      )}
    >
      {label}
    </div>
  )
}

/**
 * Bannière publicitaire GazPoints — Carousel rotatif animé.
 * - Entrée depuis la droite, sortie à gauche (CSS keyframes).
 * - Durée par publicité : champ `duration` (ms) ou défaut 8 s, borné 5–30 s.
 * - Pause au survol (desktop), navigation Précédent/Suivant, indicateurs.
 * - Respecte `prefers-reduced-motion` : pas d'animation, changement instantané.
 * - Gestion images cassées (fallback invisible), préchargement de la suivante.
 * - Nettoyage des timers au démontage, zéro fetch Neon au changement de slide.
 * - Masquage propre si aucune publicité éligible.
 */
export function PubliciteCarousel({
  publicites,
  className,
}: {
  publicites: PubliciteBannerData[]
  className?: string
}) {
  const [index, setIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [mounted, setMounted] = useState(false)

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const nextPreloadRef = useRef<Promise<void> | null>(null)
  const adsRef = useRef<PubliciteBannerData[]>([])
  const eligibleAdsRef = useRef<PubliciteBannerData[]>([])

  const ads = Array.isArray(publicites) ? publicites : []

  // Mettre à jour les refs quand les props changent
  useEffect(() => {
    adsRef.current = ads
    eligibleAdsRef.current = getEligiblePublicites(ads)
  }, [ads])

  // Détecter prefers-reduced-motion côté client
  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  // Précharger l'image de la publicité suivante
  const preloadNext = useCallback(() => {
    const eligible = eligibleAdsRef.current
    if (eligible.length <= 1) return
    const nextIdx = (index + 1) % eligible.length
    const nextAd = eligible[nextIdx]
    if (nextAd.image) {
      nextPreloadRef.current = preloadImage(nextAd.image)
    }
  }, [index])

  // Avancer au slide suivant
  const goNext = useCallback(() => {
    const eligible = eligibleAdsRef.current
    if (eligible.length <= 1) return
    setIndex((i) => (i + 1) % eligible.length)
  }, [])

  // Reculer au slide précédent
  const goPrev = useCallback(() => {
    const eligible = eligibleAdsRef.current
    if (eligible.length <= 1) return
    setIndex((i) => (i - 1 + eligible.length) % eligible.length)
  }, [])

  // Aller à un index précis (via indicateurs)
  const goTo = useCallback((i: number) => {
    const eligible = eligibleAdsRef.current
    if (i < 0 || i >= eligible.length) return
    setIndex(i)
  }, [])

  // Démarrer/redémarrer le timer de rotation
  const startTimer = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current)
    const eligible = eligibleAdsRef.current
    if (eligible.length <= 1) return
    if (isHovered) return
    if (prefersReducedMotion) return

    const currentAd = eligible[index]
    const durationMs = Math.min(
      MAX_DURATION,
      Math.max(MIN_DURATION, currentAd.duration ?? DEFAULT_DURATION)
    )

    timerRef.current = setTimeout(() => {
      goNext()
    }, durationMs)
  }, [index, isHovered, prefersReducedMotion, goNext])

  // Arrêter le timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  // Gestion du cycle : timer + préchargement
  useEffect(() => {
    const eligible = eligibleAdsRef.current
    if (eligible.length === 0) return

    startTimer()
    preloadNext()

    return () => {
      stopTimer()
      if (nextPreloadRef.current) {
        // On ne peut pas annuler une Promise, mais on ignore le résultat
        nextPreloadRef.current = null
      }
    }
  }, [index, eligibleAdsRef.current.length, isHovered, prefersReducedMotion, startTimer, stopTimer, preloadNext])

  // Pause au survol (desktop uniquement)
  const handleMouseEnter = () => {
    if (typeof window !== "undefined" && window.matchMedia("(hover: hover)").matches) {
      setIsHovered(true)
      stopTimer()
    }
  }

  const handleMouseLeave = () => {
    setIsHovered(false)
    startTimer()
  }

  // Sans publicité active dans sa période de diffusion : bannière masquée.
  if (!mounted) return null // Éviter le flash SSR
  if (eligibleAdsRef.current.length === 0) return null

  const eligibleAds = eligibleAdsRef.current
  const currentIndex = Math.min(index, Math.max(eligibleAds.length - 1, 0))
  const current = eligibleAds[currentIndex]

  return (
    <section
      aria-label="Bannière publicitaire GazPoints"
      className={cn("mx-auto w-full max-w-[800px] px-4", className)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative"
        role="region"
        aria-roledescription="carousel"
        aria-label="Publicités GazPoints"
      >
        {/* Carte courante avec animation de transition */}
        <div
          className={cn(
            "overflow-hidden",
            prefersReducedMotion ? "transition-none" : "transition-transform duration-500 ease-out"
          )}
        >
          <PubliciteBannerCard
            key={current.id}
            ad={current}
            animate={!prefersReducedMotion}
            onImageError={() => {}}
          />
        </div>

        {/* Navigation Précédent / Suivant (masquée sur mobile si 1 seule pub) */}
        {eligibleAds.length > 1 && (
          <>
            <button
              type="button"
              aria-label="Publicité précédente"
              onClick={() => { goPrev(); startTimer(); }}
              className={cn(
                "absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 md:-translate-x-4",
                "rounded-full bg-background/80 p-2 text-muted-foreground",
                "hover:bg-background hover:text-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                "opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity",
                "motion-reduce:opacity-100"
              )}
            >
              <ChevronLeft className="size-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Publicité suivante"
              onClick={() => { goNext(); startTimer(); }}
              className={cn(
                "absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 md:translate-x-4",
                "rounded-full bg-background/80 p-2 text-muted-foreground",
                "hover:bg-background hover:text-foreground transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                "opacity-0 hover:opacity-100 focus-visible:opacity-100 transition-opacity",
                "motion-reduce:opacity-100"
              )}
            >
              <ChevronRight className="size-5" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Indicateurs de slide (dots) */}
        {eligibleAds.length > 1 && (
          <div
            className="mt-4 flex items-center justify-center gap-1.5"
            role="tablist"
            aria-label="Sélectionner une publicité"
          >
            {eligibleAds.map((ad, i) => (
              <button
                key={ad.id}
                type="button"
                role="tab"
                aria-label={`Publicité ${i + 1} sur ${eligibleAds.length}`}
                aria-selected={i === currentIndex}
                aria-controls={`publicite-panel-${ad.id}`}
                onClick={() => { goTo(i); startTimer(); }}
                className={cn(
                  "h-2 rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  i === currentIndex
                    ? "w-6 bg-primary"
                    : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
                )}
              />
            ))}
          </div>
        )}

        {/* Live region pour annonce du changement (accessibilité) */}
        <div
          id={`publicite-panel-${current.id}`}
          role="tabpanel"
          aria-labelledby={`publicite-tab-${current.id}`}
          className="sr-only"
          aria-live="polite"
        >
          {current.title}
        </div>
      </div>
    </section>
  )
}