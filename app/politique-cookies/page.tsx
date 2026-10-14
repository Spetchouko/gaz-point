import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"

export const metadata: Metadata = {
  title: { absolute: "Politique relative aux cookies | GazPoints" },
  description:
    "Politique cookies de GazPoints : liste des cookies et traceurs utilisés, leurs finalités, durées, et comment gérer vos préférences via le bandeau de consentement ou les paramètres de votre navigateur.",
  robots: "index, follow",
}

const document: LegalDocument = {
  eyebrow: "Politique relative aux cookies",
  title: "Politique relative aux cookies",
  intro:
    "Cette politique explique quels cookies et technologies de suivi sont utilisés sur GazPoints, à quelles fins, et comment vous pouvez les accepter, les refuser ou les supprimer. Elle complète la Politique de confidentialité.",
  updated: "14 octobre 2026",
  sections: [
    {
      id: "definition",
      title: "1. Qu'est-ce qu'un cookie ?",
      paragraphs: [
        "Un cookie est un petit fichier texte déposé sur votre terminal (ordinateur, téléphone, tablette) lors de la visite d'un site web. Il permet de reconnaître votre navigateur lors de visites ultérieures, de mémoriser des préférences ou de collecter des informations de navigation.",
        "D'autres technologies similaires existent : localStorage, sessionStorage, pixels invisibles, empreinte numérique (fingerprinting). Cette politique les couvre toutes sous le terme « traceurs ».",
      ],
    },
    {
      id: "consentement",
      title: "2. Consentement et bandeau",
      paragraphs: [
        "Conformément à la réglementation, les traceurs non indispensables au fonctionnement du service ne sont déposés qu'après votre consentement explicite.",
        "À votre première visite, un bandeau s'affiche en bas de page. Vous pouvez :",
        "Vous pouvez changer d'avis à tout moment en supprimant le cookie « gz_consent » ou le localStorage associé, ce qui fera réapparaître le bandeau.",
      ],
      list: [
        "Accepter : autorise le dépôt des traceurs d'audience (analytics).",
        "Refuser : aucun traceur d'audience n'est déposé. Un cookie technique « gz_consent=rejected » mémorise votre choix pour 12 mois.",
        "Fermer le bandeau (croix) : équivaut à un refus. Aucun traceur d'audience n'est déposé.",
      ],
    },
    {
      id: "categories",
      title: "3. Catégories de traceurs utilisés",
      paragraphs: [
        "Seules deux catégories sont présentes sur GazPoints :",
      ],
      items: [
        {
          term: "Traceurs strictement nécessaires (exemptés de consentement)",
          value:
            "Indispensables au fonctionnement du service. Ils ne peuvent pas être désactivés via le bandeau, mais vous pouvez les bloquer via votre navigateur (ce qui cassera la navigation).",
        },
        {
          term: "Traceurs de mesure d'audience (nécessitent votre consentement)",
          value:
            "Permettent de compter les visites, pages vues, inscriptions et connexions de façon anonyme, et de mesurer la performance des publicités (impressions, clics, conversions). Aucun identifiant personnel n'est transmis.",
        },
      ],
    },
    {
      id: "detail-necessaires",
      title: "4. Détail : traceurs strictement nécessaires",
      paragraphs: [
        "Ces traceurs sont gérés par Better Auth (notre bibliothèque d'authentification) et Next.js :",
      ],
      items: [
        {
          term: "better-auth.session_token / better-auth.session_data",
          value:
            "Cookies de session HTTP-only, Secure, SameSite=Lax. Identifient votre session connectée. Durée : 30 jours maximum (configurable). Sans eux, impossible de rester connecté.",
        },
        {
          term: "better-auth.refresh_token",
          value:
            "Cookie HTTP-only pour le renouvellement silencieux de la session. Durée : 30 jours.",
        },
        {
          term: "gz_consent",
          value:
            "Cookie (ou localStorage) mémorisant votre choix sur le bandeau cookies (« accepted » ou « rejected »). Durée : 12 mois. Nécessaire pour respecter votre préférence.",
        },
        {
          term: "gazpoint_register_role",
          value:
            "Cookie temporaire (5 minutes) déposé lors du choix du rôle à l'inscription (usager ou vendeur). Transmis au serveur pour créer le compte avec le bon rôle. Supprimé automatiquement.",
        },
        {
          term: "Cloudflare Turnstile (cf_chl_*, __cf_bm)",
          value:
            "Cookies anti-robot déposés par Cloudflare sur les pages d'inscription et de connexion. Protègent contre les soumissions automatisées. Durée : session à 30 minutes. Nécessaires à la sécurité du service.",
        },
        {
          term: "Next.js / Vercel (prefetch, __next_*)",
          value:
            "Cookies techniques pour le préchargement des pages et le bon fonctionnement du framework. Durée : session.",
        },
      ],
    },
    {
      id: "detail-analytics",
      title: "5. Détail : traceurs de mesure d'audience (consentement requis)",
      paragraphs: [
        "GazPoints n'utilise **pas** Google Analytics, Matomo, Facebook Pixel, ni aucun service tiers d'analytics. La mesure d'audience est **interne, anonyme et minimale** :",
      ],
      items: [
        {
          term: "Événements collectés (après consentement)",
          value:
            "Pageviews (chemin de la page, referrer host, paramètres UTM source/medium/campaign), Inscriptions (signup), Connexions (signin). Performance publicitaire : impressions (bannière réellement visible ≥ 50 % pendant 1 s), clics, et conversions (inscription, recherche de gaz ou réservation attribuée au dernier clic dans les 30 jours). L'adresse IP n'est jamais stockée. L'identifiant utilisateur n'est lié qu'aux événements signup/signin (pas aux pageviews ni aux événements publicitaires).",
        },
        {
          term: "Stockage",
          value:
            "Base de données PostgreSQL (tables traffic_event et publicite_event) hébergée chez Neon. Les événements publicitaires ne contiennent qu'un identifiant de visiteur aléatoire, sans nom, e-mail ni téléphone. Aucune donnée n'est envoyée à un tiers.",
        },
        {
          term: "Cookie publicitaire gz_ad_ref",
          value:
            "Déposé uniquement après consentement, et seulement si vous cliquez sur une publicité. Contient l'identifiant de la publicité, un identifiant de clic aléatoire et l'horodatage du clic (aucune donnée personnelle). Cookie HTTP-only, SameSite=Lax, durée : 30 jours. Il permet de rattacher une inscription, une recherche ou une réservation à la publicité cliquée (attribution au dernier clic).",
        },
        {
          term: "Finalité",
          value:
            "Comprendre quelles pages sont visitées, d'où viennent les visiteurs, et mesurer l'adoption du service pour prioriser les améliorations.",
        },
        {
          term: "Durée de conservation",
          value:
            "13 mois maximum pour les événements bruts. Données agrégées ensuite sans limite (statistiques anonymes).",
        },
        {
          term: "Base légale",
          value:
            "Consentement (article 6.1.a RGPD par référence, standard international). Le bandeau ne propose pas de « tout accepter » par défaut : l'utilisateur doit agir positivement.",
        },
      ],
      note: "Si vous refusez le consentement, **aucun événement n'est envoyé** au serveur (/api/traffic ni /api/ads/event) et **aucun cookie publicitaire** n'est déposé. Le bandeau ne réapparaîtra pas pendant 12 mois (cookie gz_consent=rejected).",
    },
    {
      id: "reseaux-sociaux",
      title: "6. Réseaux sociaux et contenus embarqués",
      paragraphs: [
        "GazPoints n'intègre **aucun** widget, bouton de partage, vidéo YouTube, flux Facebook/Instagram/X, ni carte interactive tierce sur les pages publiques. Aucun cookie de réseau social n'est déposé par notre fait.",
      ],
    },
    {
      id: "paiement",
      title: "7. Paiement (abonnement vendeur)",
      paragraphs: [
        "Actuellement, le paiement de l'abonnement vendeur (5 000 FCFA/mois) se fait hors ligne (espèces, Mobile Money, virement). Aucun traceur de paiement (Stripe, PayPal, CinetPay, etc.) n'est présent sur le site. Si une solution de paiement en ligne est intégrée ultérieurement, cette politique sera mise à jour et un consentement spécifique sera demandé.",
      ],
    },
    {
      id: "gerer-navigateur",
      title: "8. Gérer les cookies depuis votre navigateur",
      paragraphs: [
        "Vous pouvez à tout moment bloquer, supprimer ou vider les cookies via les paramètres de votre navigateur :",
        "Attention : bloquer les cookies nécessaires (session, gz_consent, Turnstile) empêchera la connexion, l'inscription et l'affichage correct du bandeau de consentement.",
      ],
      items: [
        { term: "Chrome", value: "Paramètres > Confidentialité et sécurité > Cookies et autres données de site" },
        { term: "Firefox", value: "Paramètres > Vie privée et sécurité > Cookies et données de site" },
        { term: "Safari", value: "Réglages > Confidentialité > Gérer les données des sites web" },
        { term: "Edge", value: "Paramètres > Cookies et autorisations de site > Gérer et supprimer les cookies" },
      ],
    },
    {
      id: "modifications",
      title: "9. Modifications",
      paragraphs: [
        "Cette politique peut évoluer en cas d'ajout de nouveaux traceurs (ex. paiement en ligne, chat support, nouveaux analytics). Toute modification sera notifiée par mise à jour de la date et, pour les changements substantiels, par un nouveau bandeau de consentement.",
      ],
    },
    {
      id: "contact",
      title: "10. Contact",
      paragraphs: [
        "Pour toute question sur les cookies :",
      ],
      items: [
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Formulaire", value: "https://gazpoints.com/contact" },
      ],
    },
  ],
}

export default function PolitiqueCookiesPage() {
  return <PageLegale document={document} />
}