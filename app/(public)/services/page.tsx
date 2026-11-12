import type { Metadata } from "next"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gazpoints.com"

export const metadata: Metadata = {
  title: "Services | GazPoints",
  description:
    "Informations sur les services GazPoints : abonnement usager gratuit à vie, espace vendeur à 5 000 FCFA/mois, support technique, et FAQ rapide pour trouver du gaz au Cameroun.",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${SITE_URL}/services`,
    siteName: "GazPoints",
    title: "Services | GazPoints",
    description:
      "Découvrez tous les services GazPoints pour trouver du gaz près de chez vous au Cameroun.",
    images: [
      {
        url: `${SITE_URL}/brand/hero.webp`,
        width: 1200,
        height: 630,
        alt: "Services GazPoints",
      },
    ],
  },
  alternates: {
    canonical: `${SITE_URL}/services`,
  },
}

export default function Services() {
  return (
    <section className="py-12 max-w-md mx-auto">
      <h1 className="mb-6 text-2xl font-bold text-primary-foreground border-b pb-2 border-border">Nos services</h1>

      <ul className="space-y-4 mb-8">
        <li className="text-sm text-primary-foreground/80">
          <strong>Abonnement usager</strong> : compte gratuit à vie, suivi de vos commandes, historique de vos recherches.
        </li>
        <li className="text-sm text-primary-foreground/80">
          <strong>Espace vendeur</strong> : inscription des points de vente, publication d’offres, gestion des disponibilités.
        </li>
        <li className="text-sm text-primary-foreground/80">
          <strong>Support technique</strong> : assistance pour les problèmes de connexion, questions sur l’utilisation du gaz.
        </li>
      </ul>

      <section className="mt-8">
        <h2 className="text-xl font-semibold text-primary-foreground mb-4">FAQ rapide</h2>
        <ul className="text-sm text-primary-foreground/80 space-y-2">
          <li>Comment m’inscrire ?</li>
          <li>Comment modifier mon annonce ?</li>
          <li>Comment contacter le support ?</li>
        </ul>
      </section>
    </section>
  )
}