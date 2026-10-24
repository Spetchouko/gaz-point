import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"

export const metadata: Metadata = {
  title: { absolute: "Mentions légales | GazPoints" },
  description:
    "Mentions légales de GazPoints : identité de l'éditeur, hébergement, propriété intellectuelle, responsabilité, loi applicable et coordonnées de contact.",
  robots: "index, follow",
}

const document: LegalDocument = {
  eyebrow: "Mentions légales",
  title: "Mentions légales",
  intro:
    "Ces mentions légales définissent qui édite GazPoints, comment l'information est stockée et nos obligations vis-à-vis de nos lecteurs.",
  updated: "13 février 2026",
  sections: [
    {
      id: "editeur",
      title: "1. L'éditeur du site",
      paragraphs: [
        "GazPoints est édité par une équipe basée à Douala, Cameroun. Pour toute questionrelative aux mentions, au contenu ou aux rectifications de votre profil, contactez-nous à contact@gazpoints.com ou par le formulaire du site.",
      ],
    },
    {
      id: "hebergement",
      title: "2. Hébergement et stockage",
      paragraphs: [
        "L'information du site est stockée sur des serveurs situés hors du Cameroun (Europe et États-Unis). Les détails de stockage figurent dans la Politique de confidentialité.",
      ],
    },
    {
      id: "propriete",
      title: "3. Propriété intellectuelle",
      paragraphs: [
        "La structure, le design, le logo, le code source, les textes, les marques « GazPoints » et les bases de données sont la propriété exclusive de GazPoints ou sous licence d'utilisation.",
        "Toute reproduction, représentation ou adaptation, sans autorisation écrite, est interdite et constitue une contrefaçon sanctionnée par le droit camerounais.",
        "Les marques des fournisseurs de gaz (TotalEnergies, Tradex, Oryx…) citées sur le site appartiennent à leurs propriétaires respectifs ; leur mention est strictement informative.",
      ],
    },
    {
      id: "responsabilite",
      title: "4. Responsabilité",
      paragraphs: [
        "Les vendeurs déclarent eux-mêmes les disponibilités de gaz. GazPoints ne peut pas garantir leur exactitude.",
        "Nous ne saurions être tenus responsables des conséquences directes ou indirectes liées à l'utilisation de ces informations, ni de la disponibilité ponctuelle du site ou de son bon fonctionnement.",
        "Les liens vers des sites tiers (notamment ceux de marques de gaz) sont fournis uniquement à titre indicatif. GazPoints n'en contrôle pas le contenu et n'y est pas garanti responsable quant à leur politique de confidentialité.",
      ],
    },
    {
      id: "acces",
      title: "5. Accès au service",
      paragraphs: [
        "L'accès gratuit pour les usagers. L'inscription vendeur requiert un abonnement mensuel (5 000 FCFA, voir CGV).",
        "GazPoints se réserve le droit de suspendre, limiter ou résilier l'accès en cas de violation des CGU, de fraude ou de mise en danger de la sécurité du service.",
      ],
    },
    {
      id: "donnees",
      title: "6. Données personnelles",
      paragraphs: [
        "Le traitement des données personnelles est détaillé dans la Politique de confidentialité (/politique-confidentialite).",
      ],
    },
    {
      id: "droit-applicable",
      title: "7. Droit applicable",
      paragraphs: [
        "Ces mentions sont rédigées conformément au droit camerounais. En cas de litige non résolu à l'amiable, les tribunaux de Douala sont compétents.",
      ],
    },
    {
      id: "contact",
      title: "8. Contact",
      items: [
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Formulaire", value: "https://gazpoints.com/contact" },
      ],
    },
  ],
}

export default function MentionsLegalesPage() {
  return <PageLegale document={document} />
}