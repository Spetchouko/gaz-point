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
    "Conformément à la législation en vigueur, notamment la loi camerounaise sur les communications électroniques et les standards internationaux, les présentes mentions légales identifient l'éditeur, l'hébergeur et les conditions d'utilisation du site gazpoints.com.",
  updated: "13 février 2026",
  sections: [
    {
      id: "editeur",
      title: "1. Éditeur du site",
      items: [
        { term: "Dénomination", value: "GazPoints" },
        { term: "Forme", value: "Service en ligne d'information sur la disponibilité du gaz domestique" },
        { term: "Siège social / Adresse", value: "Douala, Cameroun" },
        { term: "Email de contact", value: "contact@gazpoints.com" },
        { term: "Site web", value: "https://gazpoints.com" },
        { term: "Directeur de la publication", value: "L'équipe GazPoints" },
      ],
      note: "Les informations d'immatriculation (RCCM, numéro d'identification fiscale) sont tenues à jour auprès des autorités camerounaises compétentes et peuvent être communiquées sur demande justifiée.",
    },
    {
      id: "hebergement",
      title: "2. Hébergement",
      items: [
        {
          term: "Hébergeur principal (frontend)",
          value: "Vercel Inc. – 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis – https://vercel.com",
        },
        {
          term: "Base de données (backend)",
          value: "Neon (Neon Technologie Inc.) – 415 Mission St, San Francisco, CA 94105, États-Unis – https://neon.tech",
        },
        {
          term: "Authentification",
          value: "Better Auth (bibliothèque open-source auto-hébergée, données stockées dans la base Neon)",
        },
        {
          term: "Email transactionnel",
          value: "SMTP via fournisseur configuré (ex. Gmail / SendGrid / Mailgun selon configuration)",
        },
        {
          term: "Anti-robot",
          value: "Cloudflare Turnstile – Cloudflare Inc., 101 Townsend St, San Francisco, CA 94107, États-Unis – https://cloudflare.com",
        },
      ],
      paragraphs: [
        "Les données sont hébergées sur des serveurs situés principalement aux États-Unis et en Europe. Voir la Politique de confidentialité pour les garanties de transferts internationaux.",
      ],
    },
    {
      id: "propriete",
      title: "3. Propriété intellectuelle",
      paragraphs: [
        "L'ensemble des éléments composant le site (structure, design, logo, charte graphique, code source, textes, bases de données, marques « GazPoints » et logos associés) est la propriété exclusive de GazPoints ou fait l'objet d'une licence d'utilisation.",
        "Toute reproduction, représentation, modification, publication, adaptation, exploitation partielle ou totale du site ou de ses éléments, par quelque procédé que ce soit, sans autorisation préalable écrite, est interdite et constitue une contrefaçon sanctionnée par le droit camerounais et les conventions internationales.",
        "Les marques des fournisseurs de gaz (TotalEnergies, Tradex, Oryx, etc.) citées sur le site appartiennent à leurs propriétaires respectifs. Leur mention a un but purement informatif pour aider l'usager à identifier les produits disponibles.",
      ],
    },
    {
      id: "responsabilite",
      title: "4. Responsabilité",
      paragraphs: [
        "GazPoints met tout en œuvre pour fournir des informations fiables et à jour. Toutefois :",
      ],
      list: [
        "Les disponibilités sont déclarées par les vendeurs eux-mêmes. GazPoints ne peut garantir leur exactitude en temps réel.",
        "Le site peut contenir des inexactitudes techniques, typographiques ou des omissions. GazPoints ne saurait être tenu responsable des conséquences directes ou indirectes de l'utilisation de ces informations.",
        "GazPoints s'efforce de maintenir le site accessible 7j/7, 24h/24, mais ne garantit pas une disponibilité continue. Des interruptions pour maintenance, mises à jour ou cas de force majeure peuvent survenir.",
        "Des liens vers des sites tiers peuvent être présents (ex. sites de marques de gaz). GazPoints n'exerce aucun contrôle sur leur contenu et décline toute responsabilité quant à leur politique de confidentialité ou leurs pratiques.",
      ],
    },
    {
      id: "acces",
      title: "5. Accès au service",
      paragraphs: [
        "L'accès au site est gratuit pour les usagers. L'inscription vendeur est soumise à un abonnement mensuel de 5 000 FCFA (voir CGV).",
        "GazPoints se réserve le droit de suspendre, limiter ou résilier l'accès au service en cas de violation des Conditions générales d'utilisation, de fraude, ou de mise en danger de la sécurité du service.",
      ],
    },
    {
      id: "donnees",
      title: "6. Données personnelles et cookies",
      paragraphs: [
        "Le traitement des données personnelles est détaillé dans la Politique de confidentialité (/politique-confidentialite).",
        "La gestion des cookies et traceurs est détaillée dans la Politique relative aux cookies (/politique-cookies).",
      ],
    },
    {
      id: "droit-applicable",
      title: "7. Droit applicable et juridiction",
      paragraphs: [
        "Les présentes mentions légales et l'utilisation du site sont régies par le droit camerounais.",
        "En cas de litige non résolu à l'amiable, les tribunaux compétents de Douala (Cameroun) sont seuls compétents.",
      ],
    },
    {
      id: "contact",
      title: "8. Contact",
      paragraphs: [
        "Pour toute question relative aux mentions légales, au site ou à son contenu :",
      ],
      items: [
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Formulaire en ligne", value: "https://gazpoints.com/contact" },
        { term: "Adresse postale", value: "GazPoints – Douala, Cameroun" },
      ],
    },
  ],
}

export default function MentionsLegalesPage() {
  return <PageLegale document={document} />
}