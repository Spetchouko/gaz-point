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

/**
 * Type de publicité : 'composed' (image + texte superposé) | 'full_banner' (bannière pré-conçue complète)
 */
export type PubliciteMode = "composed" | "full_banner"

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
  mode: PubliciteMode
  // Champs pour mode "composed"
  textAlign?: "left" | "center" | "right"
  textColor?: string
  backgroundOverlay?: string
  imageFit?: "cover" | "contain"
  titlePosition?: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right"
  descriptionPosition?: "top-left" | "top-center" | "top-right" | "center-left" | "center" | "center-right" | "bottom-left" | "bottom-center" | "bottom-right"
}

const DEFAULT_DURATION = 8000
const MIN_DURATION = 5000
const MAX_DURATION = 30000

/**
 * Pubs éligibles : statut actif ET diffusion en cours (période [startAt, endAt]).
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
 * Calcule les classes CSS de position pour le titre/description selon la position choisie.
 */
function getPositionClasses(position: string): string {
  const positions: Record<string, string> = {
    "top-left": "top-4 left-4",
    "top-center": "top-4 left-1/2 -translate-x-1/2",
    "top-right": "top-4 right-4",
    "center-left": "top-1/2 -translate-y-1/2 left-4",
    "center": "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
    "center-right": "top-1/2 -translate-y-1/2 right-4",
    "bottom-left": "bottom-4 left-4",
    "bottom-center": "bottom-4 left-1/2 -translate-x-1/2",
    "bottom-right": "bottom-4 right-4",
  }
  return positions[position] ?? "top-4 left-4"
}

/**
 * Carte unique d'une publicité - supporte deux modes :
 * - 'full_banner' : bannière pré-conçue (image = bannière complète, pas de texte superposé)
 * - 'composed' : image de fond + titre/description superposés avec positionnement
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

  const isFullBanner = ad.mode === "full_banner"
  const imageFit = ad.imageFit ?? "cover"
  const textColor = ad.textColor ?? "#FFFFFF"
  const backgroundOverlay = ad.backgroundOverlay ?? "rgba(0,0,0,0.3)"
  const textAlign = ad.textAlign ?? "left"
  const titlePosition = ad.titlePosition ?? "top-left"
  const descriptionPosition = ad.descriptionPosition ?? "bottom-left"

  return (
    <article
      ref={cardRef}
      className={cn(
        "flex h-auto w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm md:h-[200px] md:flex-row",
        animate && "animate-in fade-in duration-500 motion-reduce:animate-none",
        className
      )}
    >
      {isFullBanner ? (
        // MODE 1 : BANNIÈRE PRÉ-CONÇUE - Image = bannière complète (pleine largeur)
        <div className="w-full md:w-full">
          {ad.image && !imageError && (
            <div className="relative w-full h-[200px] overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.image}
                alt={ad.title || "Bannière publicitaire"}
                loading="lazy"
                className={`h-full w-full object-${imageFit}`}
                onError={handleImgError}
              />
            </div>
          )}
        </div>
      ) : (
        // MODE 2 : PUBLICITÉ COMPOSÉE - Image de fond + texte superposé
        <>
          {/* Zone image (pleine largeur, hauteur fixe) */}
          {ad.image && !imageError && (
            <div
              className={cn(
                "relative w-full h-[200px] overflow-hidden rounded-t-2xl md:rounded-t-none md:rounded-l-2xl md:h-full md:w-[50%]",
                animate &&
                  "animate-in slide-in-from-right-8 fade-in duration-500 ease-out motion-reduce:animate-none"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.image}
                alt=""
                loading="lazy"
                className={`h-full w-full object-${imageFit}`}
                onError={handleImgError}
              />
              {/* Overlay derrière le texte */}
              <div
                className="absolute inset-0"
                style={{ background: backgroundOverlay }}
              />
            </div>
          )}

          {/* Zone contenu superposé (mode composed) ou à côté (mode full_banner fallback) */}
          <div
            className={cn(
              isFullBanner
                ? "flex flex-1 flex-col justify-center gap-1.5 p-4 sm:p-5 md:gap-2"
                : "absolute inset-0 flex items-start justify-start p-6 md:p-8"
            )}
          >
            {ad.title && (
              <div
                className={cn(
                  "w-full max-w-[80%]",
                  getPositionClasses(titlePosition)
                )}
                style={{ textAlign, color: textColor }}
              >
                <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight drop-shadow-lg">
                  {ad.title}
                </h2>
              </div>
            )}

            {ad.description && (
              <div
                className={cn(
                  "w-full max-w-[80%] mt-2",
                  getPositionClasses(descriptionPosition)
                )}
                style={{ textAlign, color: textColor }}
              >
                <p className="text-base sm:text-lg md:text-xl leading-relaxed drop-shadow-md">
                  {ad.description}
                </p>
              </div>
            )}

            {!isFullBanner && ad.linkUrl && interactive && (
              <a
                href={ad.linkUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleClick}
                className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 drop-shadow-lg"
              >
                En savoir plus
                <ArrowRight className="size-4" />
              </a>
            )}
          </div>
        </>
      )}

      {isFullBanner && ad.linkUrl && interactive && (
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={handleClick}
          className="absolute inset-0"
          aria-label={ad.title || "Bannière publicitaire"}
        />
      )}
    </article>
  )
}

/**
 * Aperçu contextuel d'une publicité à un emplacement donné.
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

  useEffect(() => {
    adsRef.current = ads
    eligibleAdsRef.current = getEligiblePublicites(ads)
  }, [ads])

  useEffect(() => {
    setMounted(true)
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)")
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener("change", handler)
    return () => mediaQuery.removeEventListener("change", handler)
  }, [])

  const preloadNext = useCallback(() => {
    const eligible = eligibleAdsRef.current
    if (eligible.length <= 1) return
    const nextIdx = (index + 1) % eligible.length
    const nextAd = eligible[nextIdx]
    if (nextAd.image) {
      nextPreloadRef.current = preloadImage(nextAd.image)
    }
  }, [index])

  const goNext = useCallback(() => {
    const eligible = eligibleAdsRef.current
    if (eligible.length <= 1) return
    setIndex((i) => (i + 1) % eligible.length)
  }, [])

  const goPrev = useCallback(() => {
    const eligible = eligibleAdsRef.current
    if (eligible.length <= 1) return
    setIndex((i) => (i - 1 + eligible.length) % eligible.length)
  }, [])

  const goTo = useCallback((i: number) => {
    const eligible = eligibleAdsRef.current
    if (i < 0 || i >= eligible.length) return
    setIndex(i)
  }, [])

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

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  useEffect(() => {
    const eligible = eligibleAdsRef.current
    if (eligible.length === 0) return

    startTimer()
    preloadNext()

    return () => {
      stopTimer()
      if (nextPreloadRef.current) {
        nextPreloadRef.current = null
      }
    }
  }, [index, eligibleAdsRef.current.length, isHovered, prefersReducedMotion, startTimer, stopTimer, preloadNext])

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

  if (!mounted) return null
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