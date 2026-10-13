import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"

export const metadata: Metadata = {
  title: { absolute: "Conditions générales d'utilisation | GazPoints" },
  description:
    "Conditions générales d'utilisation de GazPoints : règles d'accès au service, responsabilités des usagers et des vendeurs, modération, propriété intellectuelle et limites de responsabilité.",
  robots: "index, follow",
}

const document: LegalDocument = {
  eyebrow: "Conditions générales d'utilisation",
  title: "Conditions générales d'utilisation",
  intro:
    "Les présentes conditions régissent l'accès et l'utilisation du service GazPoints. En créant un compte ou en naviguant sur le site, vous acceptez ces termes dans leur intégralité. Si vous n'êtes pas d'accord, merci de ne pas utiliser le service.",
  updated: "13 mars 2026",
  sections: [
    {
      id: "objet",
      title: "1. Objet du service",
      paragraphs: [
        "GazPoints est un service d'information qui permet aux particuliers de vérifier la disponibilité des bouteilles de gaz de cuisson auprès des points de vente partenaires à Douala, Cameroun.",
        "Le service met en relation les consommateurs (usagers) et les dépositaires de gaz (vendeurs). GazPoints n'achète, ne vend, ne livre et ne stocke aucune bouteille de gaz.",
      ],
    },
    {
      id: "acces",
      title: "2. Accès et inscription",
      paragraphs: [
        "L'accès au service est gratuit pour les usagers. La création d'un compte usager permet de sauvegarder des favoris, consulter l'historique d'achats et déposer des avis.",
        "L'inscription comme vendeur est soumise à un abonnement mensuel de 5 000 FCFA. Elle donne accès à un tableau de bord pour publier et gérer les disponibilités de ses points de vente.",
        "L'inscription requiert une adresse email valide, un mot de passe et, pour les vendeurs, le nom du dépôt. La vérification de l'email est obligatoire avant toute connexion.",
        "Un même utilisateur ne peut pas créer plusieurs comptes pour le même rôle. Les comptes inactifs depuis plus de 24 mois peuvent être supprimés après notification.",
      ],
    },
    {
      id: "responsabilites-usager",
      title: "3. Responsabilités de l'usager",
      list: [
        "Fournir des informations exactes et à jour lors de l'inscription.",
        "Ne pas partager ses identifiants ni laisser son compte être utilisé par un tiers.",
        "Utiliser le service uniquement pour un usage personnel et non commercial (sauf compte vendeur).",
        "Ne pas tenter d'extraire, copier ou agréger les données du site à grande échelle (scraping, bots).",
        "Signaler toute information erronée via la page Contact.",
      ],
    },
    {
      id: "responsabilites-vendeur",
      title: "4. Responsabilités du vendeur",
      list: [
        "Publier uniquement des disponibilités réelles et à jour pour ses propres points de vente.",
        "Indiquer des prix, formats et marques exacts. Toute information trompeuse expose à la suspension du compte.",
        "Maintenir l'abonnement à jour. En cas d'impayé, les disponibilités sont masquées sans suppression des données.",
        "Respecter la réglementation camerounaise sur la vente de gaz domestique (autorisations, sécurité, affichage des prix).",
        "Ne pas utiliser le service pour des produits autres que le gaz de cuisson en bouteille.",
      ],
    },
    {
      id: "moderation",
      title: "5. Modération et contenus",
      paragraphs: [
        "Les avis déposés par les usagers sont modérés a priori par l'équipe GazPoints. Seuls les avis approuvés sont publiés.",
        "GazPoints se réserve le droit de refuser, masquer ou supprimer tout avis qui : contient des injures, des propos diffamatoires, des informations fausses, du contenu publicitaire non sollicité, ou des données personnelles de tiers.",
        "Les disponibilités publiées par les vendeurs peuvent être vérifiées ponctuellement. En cas d'abus répété (fausses annonces, prix excessifs), le compte vendeur peut être suspendu.",
        "Les signalements d'informations erronées sont traités sous 5 jours ouvrés.",
      ],
    },
    {
      id: "propriete",
      title: "6. Propriété intellectuelle",
      paragraphs: [
        "La structure du site, le code source, le design, la marque GazPoints, le logo et les bases de données sont la propriété exclusive de GazPoints.",
        "Les informations publiées par les vendeurs (noms de points de vente, adresses, marques, formats, prix) restent la propriété de leurs auteurs, qui concèdent à GazPoints une licence d'utilisation pour l'affichage sur le service.",
        "Toute reproduction, extraction ou réutilisation substantielle du contenu du site sans autorisation écrite est interdite.",
      ],
    },
    {
      id: "disponibilite",
      title: "7. Disponibilité du service",
      paragraphs: [
        "GazPoints s'efforce d'assurer une accessibilité continue, mais ne garantit pas une disponibilité ininterrompue. Des opérations de maintenance, des pannes techniques ou des cas de force majeure peuvent entraîner des indisponibilités temporaires.",
        "Aucune indemnité n'est due en cas d'indisponibilité, y compris pour les vendeurs abonnés.",
      ],
    },
    {
      id: "responsabilite",
      title: "8. Limites de responsabilité",
      paragraphs: [
        "GazPoints fournit une information indicative sur les disponibilités. Les données proviennent des vendeurs eux-mêmes ou de signalements d'usagers. GazPoints ne peut garantir l'exactitude, l'exhaustivité ni l'actualité de chaque information à tout instant.",
        "L'usager reste responsable de vérifier sur place la disponibilité et le prix avant tout déplacement. GazPoints ne saurait être tenu responsable d'un déplacement inutile, d'une rupture de stock, d'un prix différent ou de tout préjudice indirect.",
        "GazPoints n'est pas partie aux transactions entre usagers et vendeurs. Aucun contrat de vente n'est conclu via le service.",
        "La responsabilité de GazPoints ne saurait excéder le montant de l'abonnement mensuel du vendeur concerné, le cas échéant.",
      ],
    },
    {
      id: "donnees",
      title: "9. Données personnelles",
      paragraphs: [
        "Le traitement des données personnelles est régi par la Politique de confidentialité accessible à la page /politique-confidentialite.",
        "En utilisant le service, vous consentez aux traitements décrits dans cette politique.",
      ],
    },
    {
      id: "cookies",
      title: "10. Cookies et traceurs",
      paragraphs: [
        "L'utilisation des cookies et technologies similaires est décrite dans la Politique relative aux cookies accessible à la page /politique-cookies.",
      ],
    },
    {
      id: "modifications",
      title: "11. Modifications des conditions",
      paragraphs: [
        "GazPoints peut modifier les présentes conditions à tout moment. La version mise à jour porte une nouvelle date de mise à jour et s'applique dès sa publication.",
        "Les utilisateurs connectés sont informés par email ou notification dans l'application en cas de modification substantielle. La poursuite de l'utilisation vaut acceptation.",
      ],
    },
    {
      id: "resiliation",
      title: "12. Résiliation",
      paragraphs: [
        "L'usager peut supprimer son compte à tout moment depuis son espace personnel. Les données sont effacées selon les délais décrits dans la Politique de confidentialité.",
        "Le vendeur peut résilier son abonnement à tout moment. L'accès au tableau de bord vendeur prend fin à la date d'échéance en cours. Aucun remboursement au prorata n'est effectué.",
        "GazPoints peut suspendre ou supprimer un compte en cas de violation grave ou répétée des présentes conditions, après notification et délai de régularisation de 7 jours (sauf urgence : fraude, risque légal).",
      ],
    },
    {
      id: "droit-applicable",
      title: "13. Droit applicable et litiges",
      paragraphs: [
        "Les présentes conditions sont régies par le droit camerounais.",
        "En cas de litige, une solution amiable est privilégiée. À défaut, les tribunaux compétents de Douala sont saisis.",
      ],
    },
    {
      id: "contact",
      title: "14. Contact",
      paragraphs: [
        "Pour toute question relative à ces conditions :",
      ],
      items: [
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Adresse", value: "Douala, Cameroun" },
        { term: "Site", value: "https://gazpoints.com/contact" },
      ],
    },
  ],
}

export default function CGUPage() {
  return <PageLegale document={document} />
}