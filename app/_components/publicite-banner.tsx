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
}: {
  ad: PubliciteBannerData
  interactive?: boolean
  animate?: boolean
  className?: string
}) {
  return (
    <article
      className={cn(
        "flex h-auto w-full flex-col overflow-hidden rounded-2xl border bg-card shadow-md md:h-[200px] md:flex-row",
        animate && "animate-in fade-in duration-500 motion-reduce:animate-none",
        className
      )}
    >
      {/* Zone image (gauche) */}
      {ad.image && (
        <div
          className={cn(
            "relative h-44 w-full shrink-0 overflow-hidden border-b bg-muted md:h-full md:w-[38%] md:border-b-0 md:border-r",
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
 * Bannière publicitaire GazPoints.
 * - Format : 800 × 200 px sur ordinateur, empilée et responsive sur mobile.
 * - Données : réutilise le système marketing existant (slots home_hero /
 *   home_search).
 * - Tolérance : sans pub éligible → masquée ; champs manquants gérés
 *   (image / URL / description absentes).
 */
export function PubliciteCarousel({
  publicites,
  className,
}: {
  publicites: PubliciteBannerData[]
  className?: string
}) {
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
      className={cn("mx-auto w-full max-w-[800px] px-4", className)}
    >
      <PubliciteBannerCard key={current.id} ad={current} />

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
