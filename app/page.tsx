import { Hero } from "@/app/hero"
import { Acces } from "@/app/_components/acces"
import { Benefices } from "@/app/_components/benefices"
import { CtaFinal } from "@/app/_components/cta-final"
import { Faq } from "@/app/_components/faq"
import { Fiabilite } from "@/app/_components/fiabilite"
import { Solution } from "@/app/_components/solution"
import { Storytelling } from "@/app/_components/storytelling"
import { Temoignages } from "@/app/_components/temoignages"
import { PubliciteCarousel, type PubliciteBannerData } from "@/app/_components/publicite-banner"
import { getPublicitesForSlot } from "@/lib/publicite"
import { getApprovedAvis, type AvisPublic } from "@/lib/avis"

export default async function Home() {
  // Les bannières sont décoratives : une panne du marketing ne doit jamais
  // bloquer la landing. En cas d'erreur, elles sont simplement masquées.
  // Deux emplacements : sous la bannière d'accueil (home_hero) et au-dessus
  // de « Trouver mon Gaz » (home_search).
  const results = await Promise.allSettled([
    getPublicitesForSlot("home_hero"),
    getPublicitesForSlot("home_search"),
    getApprovedAvis(),
  ])
  let heroPublicites: PubliciteBannerData[] = []
  let searchPublicites: PubliciteBannerData[] = []
  let avis: AvisPublic[] = []
  if (results[0].status === "fulfilled") {
    heroPublicites = results[0].value
  } else {
    console.error("Impossible de charger les publicités home_hero:", results[0].reason)
  }
  if (results[1].status === "fulfilled") {
    searchPublicites = results[1].value
  } else {
    console.error("Impossible de charger les publicités home_search:", results[1].reason)
  }
  if (results[2].status === "fulfilled") {
    avis = results[2].value
  } else {
    console.error("Impossible de charger les avis :", results[2].reason)
  }

  return (
    <>
      <Hero searchPublicites={searchPublicites} />
      <PubliciteCarousel publicites={heroPublicites} className="py-8 md:py-12" />
      <Storytelling />
      <Benefices />
      <Solution />
      {/* Skeleton placeholders for slower-rendering sections */}
      <div className="skeleton min-h-[120px] w-full max-w-3xl rounded-lg bg-muted" />
      <Fiabilite />
      <Faq />
      <div className="skeleton min-h-[120px] w-full max-w-3xl rounded-lg bg-muted" />
      <Temoignages avis={avis} />
      <div className="skeleton min-h-[120px] w-full max-w-3xl rounded-lg bg-muted" />
      <Acces />
      <div className="skeleton min-h-[120px] w-full max-w-3xl rounded-lg bg-muted" />
      <CtaFinal />
    </>
  )
}
