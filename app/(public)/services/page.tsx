import type { Metadata } from "next"
import { WebPageJsonLd } from "@/app/_components/json-ld"
import { FAQPageJsonLd } from "@/app/_components/json-ld"
import { BreadcrumbJsonLd } from "@/app/_components/json-ld"

const now = new Date().toISOString()

export const metadata: Metadata = {
  title: "Nos services | GazPoints",
  description:
    "Informations sur les services GazPoints : abonnement usager gratuit, espace vendeur, support technique, et FAQ. Trouvez votre bouteille de gaz au Cameroun.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.gazpoints.com/services",
    siteName: "GazPoints",
    title: "Nos services | GazPoints",
    description:
      "Informations sur les services GazPoints : abonnement usager gratuit, espace vendeur, support technique, et FAQ.",
  },
  twitter: {
    card: "summary",
    title: "Nos services | GazPoints",
    description:
      "Informations sur les services GazPoints : abonnement usager gratuit, espace vendeur, support technique, et FAQ.",
  },
  robots: {
    index: true,
    follow: true,
  },
}

// Breadcrumb data for services page
const servicesBreadcrumb = [
  { name: "Accueil", url: "https://www.gazpoints.com" },
  { name: "Services", url: "https://www.gazpoints.com/services" },
]

export default function Services() {
  const questions = [
    {
      question: "Comment s'inscrire sur GazPoints ?",
      answer:
        "L'inscription est gratuite et sans limite de durée. Créez un compte sur notre plateforme pour accéder à toutes les fonctionnalités.",
    },
    {
      question: "Comment modifier une annonce de disponibilité ?",
      answer:
        "Connectez-vous à votre espace vendeur et accédez à la section gestion des disponibilités pour modifier vos annonces.",
    },
    {
      question: "Comment contacter le support technique ?",
      answer:
        "Vous pouvez nous joindre via le formulaire de contact ou par email pour toute assistance technique.",
    },
    {
      question: "Comment réserver une bouteille de gaz ?",
      answer:
        "Sélectionnez un point de disponibilité, cliquez sur 'Réserver cette bouteille' et suivez les étapes de confirmation de votre réservation.",
    },
  ]

  return (
    <div className="py-12 max-w-md mx-auto">
      <WebPageJsonLd
        name="Nos services | GazPoints"
        description="Informations sur les services GazPoints : abonnement usager gratuit, espace vendeur, support technique, et FAQ. Trouvez votre bouteille de gaz au Cameroun."
        url="https://www.gazpoints.com/services"
        datePublished={now}
        dateModified={now}
      />
      <FAQPageJsonLd
        name="Nos services | GazPoints"
        description="Informations sur les services GazPoints : abonnement usager gratuit, espace vendeur, support technique, et FAQ. Trouvez votre bouteille de gaz au Cameroun."
        questions={questions}
      />
      <BreadcrumbJsonLd items={[
        { name: "Accueil", url: "https://www.gazpoints.com" },
        { name: "Services", url: "https://www.gazpoints.com/services" },
      ]}
      />
      <h1 className="mb-6 text-2xl font-bold text-primary-foreground border-b pb-2 border-border">Nos services</h1>

      <ul className="space-y-4 mb-8">
        <li className="text-sm text-primary-foreground/80">
          <strong>Abonnement usager</strong> : compte gratuit à vie, suivi de vos commandes, historique de vos recherches.
        </li>
        <li className="text-sm text-primary-foreground/80">
          <strong>Espace vendeur</strong> : inscription des points de vente, publication d'offres, gestion des disponibilités.
        </li>
        <li className="text-sm text-primary-foreground/80">
          <strong>Support technique</strong> : assistance pour les problèmes de connexion, questions sur l'utilisation du gaz.
        </li>
      </ul>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-primary-foreground mb-4">FAQ rapide</h2>
        <ul className="text-sm text-primary-foreground/80 space-y-2">
          <li>Comment m'inscrire ?</li>
          <li>Comment modifier mon annonce ?</li>
          <li>Comment contacter le support ?</li>
        </ul>
      </section>
    </div>
  )
}