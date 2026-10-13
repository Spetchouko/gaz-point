"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils"

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
}

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
 * Bannière publicitaire GazPoints.
 * - Position : au-dessus de la section « Situation courante », jamais dans la Hero.
 * - Format : 800 × 200 px sur ordinateur, empilée et responsive sur mobile.
 * - Gabarit : image compacte à gauche (animation fluide de droite à gauche),
 *   titre + texte court + bouton d’action (URL admin) à droite.
 * - Données : réutilise le système marketing existant (slot home_hero).
 * - Tolérance : sans pub éligible → masquée ; champs manquants gérés
 *   (image / URL / description absentes).
 */
export function PubliciteCarousel({ publicites }: { publicites: PubliciteBannerData[] }) {
  const [index, setIndex] = useState(0)

  const ads = Array.isArray(publicites) ? publicites : []
  const eligibleAds = getEligiblePublicites(ads)

  // Défilement automatique (7 s), boucle continue.
  useEffect(() => {
    if (eligibleAds.length <= 1) return
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % eligibleAds.length)
    }, 7000)
    return () => clearInterval(id)
  }, [eligibleAds.length])

  // Sans publicité active dans sa période de diffusion : bannière masquée.
  if (eligibleAds.length === 0) return null

  const currentIndex = Math.min(index, Math.max(eligibleAds.length - 1, 0))
  const current = eligibleAds[currentIndex]

  return (
    <section
      aria-label="Bannière publicitaire GazPoints"
      className="mx-auto w-full max-w-[800px] px-4"
    >
      <article
        key={current.id}
        className="flex h-auto w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-md animate-in fade-in duration-500 motion-reduce:animate-none md:h-[200px] md:flex-row"
      >
        {/* Zone image (gauche) — animation droite → gauche à chaque slide */}
        {current.image && (
          <div className="relative h-44 w-full shrink-0 overflow-hidden border-b bg-muted animate-in slide-in-from-right-8 fade-in duration-500 ease-out motion-reduce:animate-none md:h-full md:w-[38%] md:border-b-0 md:border-r">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={current.image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        )}

        {/* Zone contenu (droite) : titre + texte court + bouton d’action */}
        <div className="flex flex-1 flex-col justify-center gap-1.5 p-4 sm:p-5 md:gap-2">
          <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
            {current.title || "GazPoints"}
          </h2>

          {(current.price !== null || current.priceLabel) && (
            <span className="w-fit rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
              {current.priceLabel ??
                (current.price !== null
                  ? `${new Intl.NumberFormat("fr-FR").format(current.price)} FCFA`
                  : "")}
            </span>
          )}

          {current.description && (
            <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
              {current.description}
            </p>
          )}

          {current.linkUrl && (
            <a
              href={current.linkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            >
              En savoir plus
              <ArrowRight className="size-4" />
            </a>
          )}
        </div>
      </article>

      {/* Indicateurs de slide */}
      {eligibleAds.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {eligibleAds.map((ad, i) => (
            <button
              key={ad.id}
              type="button"
              aria-label={`Publicité ${i + 1} sur ${eligibleAds.length}`}
              aria-current={i === currentIndex ? "true" : undefined}
              onClick={() => setIndex(i)}
              className={cn(
                "h-2 rounded-full transition-all",
                i === currentIndex
                  ? "w-5 bg-primary"
                  : "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/60"
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}