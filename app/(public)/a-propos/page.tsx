import type { Metadata } from "next"
import { Fragment } from "react"
import { SoftSeparator } from "@/app/_components/soft-separator"
import { AproposCta } from "@/app/_components/apropos-cta"
import { AproposHero } from "@/app/_components/apropos-hero"
import { Equipe } from "@/app/_components/equipe"
import { NotreDemarche } from "@/app/_components/notre-demarche"
import { NotreMethode } from "@/app/_components/notre-methode"
import { NotrePromesse } from "@/app/_components/notre-promesse"
import { WebPageJsonLd } from "@/app/_components/json-ld"

export const metadata: Metadata = {
  title: { absolute: "À propos | GazPoints" },
  description:
    "GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala et au Cameroun. Profil usager gratuit à vie, espace vendeur à 5 000 FCFA/mois : notre point de départ, nos engagements et la vérification de l'information.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.gazpoints.com/a-propos",
    siteName: "GazPoints",
    title: "À propos | GazPoints",
    description: "GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala et au Cameroun.",
  },
  twitter: {
    card: "summary",
    title: "À propos | GazPoints",
    description: "GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala et au Cameroun.",
  },
}

export default function APropos() {
  return (
    <div className="min-h-screen bg-[var(--section-green)] overflow-x-hidden">
      <Fragment>
        <WebPageJsonLd
          name="À propos | GazPoints"
          description="GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala et au Cameroun. Profil usager gratuit à vie, espace vendeur à 5 000 FCFA/mois : notre point de départ, nos engagements et la vérification de l'information."
          url="https://www.gazpoints.com/a-propos"
        />
        <AproposHero />
        <SoftSeparator />
        <NotreDemarche />
        <SoftSeparator />
        <NotrePromesse />
        <SoftSeparator />
        <NotreMethode />
        <SoftSeparator />
        <Equipe />
        <SoftSeparator />
        <AproposCta />
      </Fragment>
    </div>
  )
}