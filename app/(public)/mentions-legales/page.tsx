import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.gazpoints.com"

export const metadata: Metadata = {
  title: { absolute: "Mentions légales | GazPoints" },
  description:
    "Mentions légales de GazPoints : identité de l'éditeur, hébergeur, conditions d'utilisation du site et informations de contact à Douala, Cameroun.",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: `${SITE_URL}/mentions-legales`,
    siteName: "GazPoints",
    title: "Mentions légales | GazPoints",
    images: [
      {
        url: `${SITE_URL}/brand/hero.webp`,
        width: 1200,
        height: 630,
        alt: "Mentions légales GazPoints",
      },
    ],
  },
  alternates: {
    canonical: `${SITE_URL}/mentions-legales`,
  },
}

const document: LegalDocument = {
  eyebrow: "Mentions légales",
  title: "Mentions légales",
  intro:
    "Conformément aux dispositions légales en vigueur, retrouvez ci-dessous les informations relatives à l'éditeur et à l'hébergeur du site GazPoints.",
  updated: "12 novembre 2026",
  sections: [
    {
      id: "editeur",
      title: "1. Éditeur du site",
      paragraphs: [
        "Le site https://www.gazpoints.com est édité par la société GazPoints, basée à Douala, Cameroun.",
      ],
      items: [
        { term: "Nom", value: "GazPoints" },
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Adresse", value: "Douala, Cameroun" },
      ],
    },
    {
      id: "hebergeur",
      title: "2. Hébergeur",
      paragraphs: [
        "Le site est hébergé par les services suivants :",
      ],
      items: [
        {
          term: "Hébergement frontend",
          value: "Vercel (https://vercel.com)",
        },
        {
          term: "Base de données",
          value: "Neon (https://neon.tech)",
        },
        {
          term: "Envoi d'emails",
          value: "SMTP via Gmail",
        },
      ],
    },
    {
      id: "directeur-publication",
      title: "3. Directeur de publication",
      paragraphs: [
        "Le directeur de publication est le représentant légal de GazPoints.",
      ],
    },
    {
      id: "propriete-intellectuelle",
      title: "4. Propriété intellectuelle",
      paragraphs: [
        "La structure du site, le code source, le design, la marque GazPoints, le logo et les bases de données sont la propriété exclusive de GazPoints. Toute reproduction, totale ou partielle, est interdite sans autorisation écrite préalable.",
      ],
    },
    {
      id: "donnees-personnelles",
      title: "5. Données personnelles",
      paragraphs: [
        "Le traitement des données personnelles est régi par la Politique de confidentialité accessible à l'adresse /politique-confidentialite.",
      ],
    },
    {
      id: "cookies",
      title: "6. Cookies",
      paragraphs: [
        "L'utilisation des cookies est décrite dans la Politique relative aux cookies accessible à l'adresse /politique-cookies.",
      ],
    },
    {
      id: "responsabilite",
      title: "7. Responsabilité",
      paragraphs: [
        "GazPoints s'efforce de fournir des informations exactes et à jour, mais ne peut garantir l'exhaustivité ou l'exactitude des disponibilités publiées par les vendeurs. L'usager reste responsable de vérifier sur place la disponibilité et le prix avant tout déplacement.",
      ],
    },
    {
      id: "loi-applicable",
      title: "8. Loi applicable",
      paragraphs: [
        "Les présentes mentions légales sont régies par le droit camerounais. En cas de litige, les tribunaux compétents de Douala sont saisis.",
      ],
    },
    {
      id: "contact",
      title: "9. Contact",
      paragraphs: [
        "Pour toute question relative aux présentes mentions légales :",
      ],
      items: [
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Formulaire", value: "https://gazpoints.com/contact" },
        { term: "Adresse", value: "Douala, Cameroun" },
      ],
    },
  ],
}

export default function MentionsLegalesPage() {
  return <PageLegale document={document} />
}
