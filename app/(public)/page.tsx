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
import { getCachedPublicitesForBothSlots } from "@/lib/publicite"
import { getApprovedAvis, type AvisPublic } from "@/lib/avis"
import { errorMessage } from "@/lib/errors"
import { WebPageJsonLd } from "@/app/_components/json-ld"
import type { Metadata } from "next"

const now = new Date().toISOString()

// Les publicités et les avis proviennent de la base de données : la page est
// rendue à la demande pour ne pas figer ces données au moment du build (et
// pour que `next build` n'exige pas une base accessible).
export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "GazPoints – Trouvez votre bouteille de gaz au Cameroun",
  description: "GazPoints est la plateforme qui vous permet de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente au Cameroun. Trouvez le gaz près de chez vous sans vous déplacer inutilement.",
  keywords: [
    "gaz bouteille disponibilité Cameroun",
    "trouver gaz Douala",
    "point de vente gaz Cameroun",
    "bouteille gaz 6 kg 12,5 kg",
    "gaz domestique Cameroun",
    "GazPoints",
  ],
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.gazpoints.com/",
    siteName: "GazPoints",
    title: "GazPoints – Trouvez votre bouteille de gaz au Cameroun",
    description: "GazPoints est la plateforme qui vous permet de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente au Cameroun.",
  },
}

export default async function Home() {
  // Les bannières sont décoratives : une panne du marketing ne doit jamais
  // bloquer la landing. En cas d'erreur, elles sont simplement masquées.
  // Deux emplacements : sous la bannière d'accueil (home_hero) et au-dessus
  // de « Trouver mon Gaz » (home_search). Requête groupée + cache partagé.
  const [publicitesResult, avisResult] = await Promise.allSettled([
    getCachedPublicitesForBothSlots(),
    getApprovedAvis(),
  ])
  let heroPublicites: PubliciteBannerData[] = []
  let searchPublicites: PubliciteBannerData[] = []
  let avis: AvisPublic[] = []
  if (publicitesResult.status === "fulfilled") {
    heroPublicites = publicitesResult.value.home_hero
    searchPublicites = publicitesResult.value.home_search
  } else {
    console.warn(
      "Impossible de charger les publicités (groupées):",
      errorMessage(publicitesResult.reason)
    )
  }
  if (avisResult.status === "fulfilled") {
    avis = avisResult.value
  } else {
    console.warn("Impossible de charger les avis :", errorMessage(avisResult.reason))
  }

  return (
    <>
      <WebPageJsonLd
        name="GazPoints – Trouvez votre bouteille de gaz au Cameroun"
        description="GazPoints est la plateforme qui vous permet de rechercher et de vérifier la disponibilité des bouteilles de gaz auprès des points de vente au Cameroun."
        url="https://www.gazpoints.com/"
        datePublished={now}
        dateModified={now}
      />
      <Hero searchPublicites={searchPublicites} />
      <PubliciteCarousel publicites={heroPublicites} className="py-8 md:py-12" />
      <Storytelling />
      <Benefices />
      <Solution />
      <Fiabilite />
      <Faq />
      <Temoignages avis={avis} />
      <Acces />
      <CtaFinal />
    </>
  )
}
