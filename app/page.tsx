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
  // Deux emplacements seulement : sous la recherche et au-dessus de la FAQ.
  let searchPublicites: PubliciteBannerData[] = []
  try {
    searchPublicites = await getPublicitesForSlot("home_search")
  } catch (error) {
    console.error("Impossible de charger les publicités home_search :", error)
  }

  // Même principe pour les avis : seuls les avis approuvés sont publics,
  // et une erreur de chargement masque simplement la section.
  let avis: AvisPublic[] = []
  try {
    avis = await getApprovedAvis()
  } catch (error) {
    console.error("Impossible de charger les avis :", error)
  }

  return (
    <>
      <Hero />
      <Storytelling />
      <Benefices />
      <Solution />
      <PubliciteCarousel
        publicites={searchPublicites}
        className="py-8 md:py-12"
      />
      <Fiabilite />
      <Faq />
      <Temoignages avis={avis} />
      <Acces />
      <CtaFinal />
    </>
  )
}
