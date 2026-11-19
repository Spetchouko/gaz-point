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
import { FAQPageJsonLd } from "@/app/_components/json-ld"
import { BreadcrumbJsonLd } from "@/app/_components/json-ld"

const now = new Date().toISOString()

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
    description:
      "GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala et au Cameroun.",
  },
  twitter: {
    card: "summary",
    title: "À propos | GazPoints",
    description:
      "GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala et au Cameroun.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function APropos() {
  const questions = [
    {
      question: "Comment s'inscrire sur GazPoints ?",
      answer: "L'inscription est gratuite et sans limite de durée. Créez un compte sur notre plateforme pour accéder à toutes les fonctionnalités.",
    },
    {
      question: "Comment trouver un point de vente de gaz ?",
      answer: "Utilisez notre moteur de recherche en indiquant la marque, le format souhaité ou votre quartier à Douala ou dans les autres villes du Cameroun.",
    },
    {
      question: "Comment réserver une bouteille de gaz ?",
      answer: "Sélectionnez un point de disponibilité, cliquez sur 'Réserver cette bouteille' et suivez les étapes de confirmation de votre réservation.",
    },
  ]

  const breadcrumbItems = [
    { name: "Accueil", url: "https://www.gazpoints.com" },
    { name: "À propos", url: "https://www.gazpoints.com/a-propos" },
  ]

  return (
    <div className="min-h-screen bg-[var(--section-green)] overflow-x-hidden">
      <Fragment>
        <WebPageJsonLd
          name="À propos | GazPoints"
          description="GazPoints est un service d'information sur les points de vente de gaz de cuisson à Douala et au Cameroun. Profil usager gratuit à vie, espace vendeur à 5 000 FCFA/mois : notre point de départ, nos engagements et la vérification de l'information."
          url="https://www.gazpoints.com/a-propos"
          datePublished={now}
          dateModified={now}
        />
        <BreadcrumbJsonLd items={breadcrumbItems} />
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