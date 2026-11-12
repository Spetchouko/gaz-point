import type { Metadata } from "next"
import { Fragment } from "react"
import { SoftSeparator } from "@/app/_components/soft-separator"
import { AproposCta } from "@/app/_components/apropos-cta"
import { AproposHero } from "@/app/_components/apropos-hero"
import { Equipe } from "@/app/_components/equipe"
import { NotreDemarche } from "@/app/_components/notre-demarche"
import { NotreMethode } from "@/app/_components/notre-methode"
import { NotrePromesse } from "@/app/_components/notre-promesse"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gazpoints.com"

export const metadata: Metadata = {
  title: { absolute: "À propos | GazPoints" },
  description:
    "GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala. Profil usager gratuit à vie, espace vendeur à 5 000 FCFA/mois : notre point de départ, nos engagements et la vérification de l'information.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${SITE_URL}/a-propos`,
    siteName: "GazPoints",
    title: "À propos | GazPoints",
    description:
      "Découvrez GazPoints, le service qui vous aide à trouver du gaz près de chez vous au Cameroun.",
    images: [
      {
        url: `${SITE_URL}/brand/hero.webp`,
        width: 1200,
        height: 630,
        alt: "À propos de GazPoints",
      },
    ],
  },
  alternates: {
    canonical: `${SITE_URL}/a-propos`,
  },
}

export default function APropos() {
  return (
    <div className="min-h-screen bg-[var(--section-green)] overflow-x-hidden">
      <Fragment>
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