import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"

export const metadata: Metadata = {
  title: { absolute: "Politique de confidentialité | GazPoints" },
  description:
    "Politique de confidentialité de GazPoints : données collectées, finalités, base légale, conservation, sécurité, droits des utilisateurs et coordonnées du responsable de traitement.",
  robots: "index, follow",
}

const document: LegalDocument = {
  eyebrow: "Politique de confidentialité",
  title: "Politique de confidentialité",
  intro:
    "GazPoints attache une importance capitale à la protection de vos données personnelles. Cette politique explique quelles données nous collectons, pourquoi, comment nous les protégeons et quels sont vos droits. Elle s'applique à tous les utilisateurs du site et de l'application GazPoints.",
  updated: "13 avril 2026",
  sections: [
    {
      id: "responsable",
      title: "1. Responsable de traitement",
      paragraphs: [
        "Le responsable de traitement est GazPoints, représenté par son équipe éditoriale et technique, basée à Douala, Cameroun.",
      ],
      items: [
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Adresse postale", value: "Douala, Cameroun" },
      ],
    },
    {
      id: "donnees-collectees",
      title: "2. Données collectées",
      paragraphs: [
        "Nous ne collectons que les données strictement nécessaires au fonctionnement du service. Selon votre rôle, les données diffèrent :",
      ],
      list: [
        "Usager (client) : nom complet, adresse email, mot de passe haché, numéro de téléphone camerounais (+237, optionnel), rôle, photo de profil (optionnelle), statut de vérification email/téléphone, favoris, historique d'achats (recharges), avis déposés.",
        "Vendeur : nom du dépôt (utilisé comme nom du compte), adresse email, mot de passe haché, numéro de téléphone (optionnel), rôle, points de vente gérés (nom, quartier, adresse, téléphone, marques, formats), disponibilités publiées (statut, quantité, prix, format, marque, poids, expiration, téléphone du dépositaire), abonnement actif/inactif.",
        "Administrateur / Collaborateur : nom, email, rôle, permissions accordées, journal des actions d'administration (création, modification, suppression, export).",
        "Visiteurs (non connectés) : aucune donnée personnelle n'est collectée sans consentement. Seuls des événements de trafic anonymes peuvent être enregistrés si le consentement est donné (voir section Cookies).",
      ],
    },
    {
      id: "finalites",
      title: "3. Finalités et bases légales",
      paragraphs: [
        "Chaque traitement repose sur une base légale au sens du droit camerounais et des standards internationaux (RGPD par référence) :",
      ],
      items: [
        {
          term: "Création et gestion du compte",
          value: "Exécution du contrat (CGU). Base : contrat.",
        },
        {
          term: "Authentification et sécurité (sessions, prévention fraude)",
          value: "Intérêt légitime (sécurité du service).",
        },
        {
          term: "Affichage des disponibilités et recherche",
          value: "Exécution du service (intérêt légitime pour les visiteurs).",
        },
        {
          term: "Gestion des favoris et historique d'achats",
          value: "Exécution du contrat (fonctionnalités demandées par l'usager).",
        },
        {
          term: "Publication et modération des avis",
          value: "Consentement (dépôt volontaire) + intérêt légitime (modération).",
        },
        {
          term: "Facturation et gestion de l'abonnement vendeur (5 000 FCFA/mois)",
          value: "Exécution du contrat (CGV).",
        },
        {
          term: "Envoi d'emails transactionnels (vérification, réinitialisation mot de passe, notifications de compte)",
          value: "Exécution du contrat / obligation légale (sécurité).",
        },
        {
          term: "Mesure d'audience anonyme (pages visitées, inscriptions, connexions) et performance des publicités (impressions, clics, conversions)",
          value: "Consentement (via bandeau cookies).",
        },
        {
          term: "Lutte contre les robots (Cloudflare Turnstile)",
          value: "Intérêt légitime (protection du service).",
        },
        {
          term: "Journal d'audit des actions d'administration",
          value: "Oblégation légale / intérêt légitime (responsabilité, sécurité).",
        },
      ],
    },
    {
      id: "partage",
      title: "4. Partage des données",
      paragraphs: [
        "Vos données ne sont jamais vendues, louées ni échangées à des fins commerciales. Elles peuvent être partagées uniquement dans les cas suivants :",
      ],
      list: [
        "Hébergement et infrastructure : Neon (base de données PostgreSQL), Vercel (hébergement frontend), fournisseurs d'email (SMTP). Ces sous-traitants agissent selon nos instructions et offrent des garanties de sécurité.",
        "Authentification Google : si vous vous connectez via Google, votre identifiant Google, email et nom sont transmis à Better Auth pour créer ou lier votre compte. Consultez la politique de confidentialité de Google.",
        "Autorités judiciaires : sur réquisition légale ou décision de justice, nous pouvons être tenus de communiquer certaines données.",
        "Vendeurs ↔ Usagers : aucun échange direct de données personnelles n'a lieu via la plateforme. Les usagers voient le nom du dépôt, l'adresse et le téléphone public du point de vente. Les vendeurs ne voient pas l'identité des usagers qui consultent leurs disponibilités.",
      ],
    },
    {
      id: "conservation",
      title: "5. Durée de conservation",
      paragraphs: [
        "Les durées ci-dessous sont des maxima. Les données sont supprimées ou anonymisées dès qu'elles ne sont plus nécessaires :",
      ],
      items: [
        { term: "Compte usager actif", value: "Tant que le compte existe. Suppression à la demande ou après 24 mois d'inactivité (notification préalable)." },
        { term: "Compte vendeur actif", value: "Tant que l'abonnement est à jour. Données conservées 12 mois après résiliation pour les besoins comptables, puis supprimées." },
        { term: "Données d'authentification (sessions, tokens)", value: "Durée de validité du token (maximum 30 jours). Journaux de connexion : 12 mois." },
        { term: "Historique d'achats (recharges)", value: "5 ans à compter de l'achat (obligation comptable)." },
        { term: "Avis publiés", value: "Tant que le compte auteur existe, puis 3 ans après suppression du compte (anonymisés)." },
        { term: "Événements de trafic (analytics consentis)", value: "13 mois maximum, agrégés ensuite." },
        { term: "Événements publicitaires (publicite_event, consentis)", value: "13 mois maximum, agrégés ensuite. Aucune donnée personnelle : identifiant de visiteur aléatoire uniquement." },
        { term: "Journal d'actions admin", value: "3 ans." },
        { term: "Emails de contact / support", value: "3 ans après dernier échange." },
      ],
    },
    {
      id: "securite",
      title: "6. Sécurité",
      paragraphs: [
        "Mesures techniques et organisationnelles mises en œuvre :",
      ],
      list: [
        "Mots de passe hachés avec bcrypt (via Better Auth), jamais stockés en clair.",
        "Connexions HTTPS/TLS 1.2+ sur tout le site.",
        "Cookies de session HttpOnly, Secure, SameSite=Lax.",
        "Vérification email obligatoire avant toute connexion.",
        "Protection anti-robot (Turnstile) sur les formulaires sensibles.",
        "Accès base de données restreint aux IP autorisées (Neon).",
        "Journal d'audit des actions d'administration (traçabilité).",
        "Sauvegardes automatiques quotidiennes de la base de données (Neon).",
      ],
      note: "Malgré ces mesures, aucun système n'offre une sécurité absolue. En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits, nous vous en informerons dans les meilleurs délais conformément à la réglementation.",
    },
    {
      id: "droits",
      title: "7. Vos droits",
      paragraphs: [
        "Vous disposez des droits suivants sur vos données personnelles :",
        "Pour exercer vos droits, contactez-nous à contact@gazpoints.com en précisant votre demande et votre identité (email du compte). Nous répondons sous 30 jours.",
      ],
      list: [
        "Accès : obtenir une copie de vos données.",
        "Rectification : corriger des données inexactes ou incomplètes.",
        "Effacement : demander la suppression de vos données (sauf obligations légales de conservation, ex. factures).",
        "Limitation : geler temporairement un traitement.",
        "Portabilité : recevoir vos données dans un format structuré (JSON/CSV) pour les transmettre à un tiers.",
        "Opposition : vous opposer aux traitements basés sur l'intérêt légitime (ex. analytics).",
        "Retrait du consentement : pour les traitements basés sur le consentement (analytics, cookies), sans affecter la licéité du traitement antérieur.",
        "Décisions automatisées : vous n'êtes soumis à aucune décision entièrement automatisée produisant des effets juridiques.",
      ],
    },
    {
      id: "mineurs",
      title: "8. Mineurs",
      paragraphs: [
        "Le service n'est pas destiné aux personnes de moins de 16 ans. Nous ne collectons pas sciemment de données auprès de mineurs. Si un titulaire de responsabilité parentale découvre qu'un mineur nous a fourni des données, il peut nous contacter pour demander leur suppression.",
      ],
    },
    {
      id: "transferts",
      title: "9. Transferts hors Cameroun",
      paragraphs: [
        "Nos hébergeurs (Neon, Vercel) peuvent stocker des données sur des serveurs situés hors du Cameroun (Europe, États-Unis). Ces transferts s'appuient sur des clauses contractuelles types ou des décisions d'adéquation reconnues. Nous choisissons des fournisseurs offrant un niveau de protection équivalent.",
      ],
    },
    {
      id: "modifications",
      title: "10. Modifications de cette politique",
      paragraphs: [
        "Cette politique peut être mise à jour pour refléter les évolutions du service ou de la réglementation. La nouvelle version porte une date de mise à jour et s'applique dès publication. Les utilisateurs connectés sont informés par email en cas de changement substantiel.",
      ],
    },
    {
      id: "contact",
      title: "11. Contact et réclamations",
      paragraphs: [
        "Pour toute question, exercice de droits ou réclamation :",
        "Si vous estimez que vos droits ne sont pas respectés, vous pouvez introduire une réclamation auprès de l'autorité de protection des données compétente au Cameroun.",
      ],
      items: [
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Formulaire", value: "https://gazpoints.com/contact" },
        { term: "Adresse", value: "Douala, Cameroun" },
      ],
    },
  ],
}

export default function PolitiqueConfidentialitePage() {
  return <PageLegale document={document} />
}