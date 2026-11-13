import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"

export const metadata: Metadata = {
  title: { absolute: "Conditions générales de vente | GazPoints" },
  description:
    "Conditions générales de vente de l'abonnement vendeur GazPoints (5 000 FCFA/mois) : souscription, paiement, résiliation, remboursement, obligations des parties et service après-vente.",
  robots: "index, follow",
}

const document: LegalDocument = {
  eyebrow: "Conditions générales de vente",
  title: "Conditions générales de vente",
  intro:
    "Ces conditions régissent la souscription et l'utilisation de l'abonnement vendeur GazPoints (accès au tableau de bord de publication des disponibilités). Elles complètent les Conditions générales d'utilisation.",
  updated: "13 octobre 2026",
  sections: [
    {
      id: "objet",
      title: "1. Objet",
      paragraphs: [
        "L'abonnement vendeur donne accès à un espace privé (tableau de bord) permettant de :",
        "L'abonnement ne comprend pas : la création du point de vente physique, la fourniture de gaz, la livraison, l'encaissement des ventes, ni aucune prestation logistique.",
      ],
      list: [
        "Créer et gérer ses points de vente (nom, quartier, adresse, téléphone, marques, formats).",
        "Publier, modifier, supprimer les disponibilités de gaz par point de vente (statut, quantité, prix, format, marque, poids, date d'expiration, téléphone du dépositaire).",
        "Consulter les statistiques de visibilité de ses annonces (vues, clics si disponibles).",
        "Répondre aux signalements d'informations erronées.",
      ],
    },
    {
      id: "tarif",
      title: "2. Tarif et facturation",
      items: [
        { term: "Prix mensuel", value: "5 000 FCFA (cinq mille francs CFA) par mois civil commencé." },
        { term: "Devise", value: "Franc CFA (XAF), taux fixe." },
        { term: "Périodicité", value: "Mensuelle, tacitement reconductible." },
        { term: "Date de facturation", value: "Le jour de la souscription, puis chaque mois à la même date." },
        { term: "Moyens de paiement acceptés", value: "Espèces (remise en main propre), Mobile Money (MTN MoMo, Orange Money), Virement bancaire. Aucun paiement en ligne n'est encore intégré." },
        { term: "Facture", value: "Une facture PDF est envoyée par email à chaque paiement validé. Elle mentionne : numéro, date, période couverte, montant, TVA si applicable, identifiant du vendeur." },
      ],
      note: "Le prix peut être révisé avec un préavis de 30 jours par email. Le vendeur peut résilier avant la nouvelle échéance s'il n'accepte pas la nouvelle tarification.",
    },
    {
      id: "souscription",
      title: "3. Souscription et activation",
      paragraphs: [
        "La souscription se fait en deux temps :",
        "Tant que le paiement n'est pas confirmé, le compte reste en statut « en attente » et le tableau de bord est inaccessible. Aucune disponibilité n'est publiée pendant cette période.",
      ],
      list: [
        "Création du compte vendeur via /inscription/vendeur (email, mot de passe, nom du dépôt). La vérification email est obligatoire.",
        "Paiement du premier mois. L'accès au tableau de bord est activé manuellement par l'équipe GazPoints après confirmation du paiement (délai habituel : quelques heures, maximum 1 jour ouvré).",
      ],
    },
    {
      id: "paiement",
      title: "4. Paiement et incidents",
      paragraphs: [
        "Le vendeur s'engage à payer chaque mensualité avant ou à la date d'échéance.",
        "En cas de retard de paiement supérieur à 7 jours :",
        "En cas d'impayé supérieur à 30 jours : le compte peut être désactivé et les données archivées pendant 12 mois avant suppression définitive.",
        "Tout paiement effectué valide la période correspondante. Aucun remboursement n'est effectué pour une période déjà commencée, sauf cas de force majeure ou faute de GazPoints.",
      ],
      list: [
        "Les disponibilités publiées sont masquées (non supprimées) et n'apparaissent plus dans les recherches.",
        "L'accès au tableau de bord est conservé en lecture seule.",
        "Aucune pénalité de retard n'est appliquée, mais le service est suspendu jusqu'à régularisation.",
      ],
    },
    {
      id: "resiliation",
      title: "5. Résiliation",
      paragraphs: [
        "Le vendeur peut résilier son abonnement à tout moment :",
        "La résiliation prend effet à la fin de la période mensuelle en cours. L'accès au tableau de bord reste actif jusqu'à cette date. Aucun remboursement au prorata temporis n'est effectué pour le mois en cours.",
        "GazPoints peut résilier l'abonnement en cas de : violation grave des CGU/CGV (fausses annonces répétées, prix excessifs, non-respect de la réglementation gaz), fraude au paiement, inactivité prolongée (6 mois sans publication ni connexion) après mise en demeure de 15 jours.",
        "En cas de résiliation par GazPoints pour faute du vendeur, aucun remboursement n'est dû pour la période restant à courir.",
      ],
      list: [
        "Depuis son tableau de bord (bouton « Résilier l'abonnement »).",
        "Ou par email à contact@gazpoints.com.",
      ],
    },
    {
      id: "obligations-vendeur",
      title: "6. Obligations spécifiques du vendeur abonné",
      list: [
        "Publier uniquement des informations exactes, à jour et conformes à la réglementation camerounaise sur le gaz domestique (arrêtés ministériels sur les prix homologués, conditions de stockage, signalétique).",
        "Ne pas publier de disponibilités pour des points de vente dont il n'est pas le dépositaire légitime.",
        "Mettre à jour ou retirer les disponibilités épuisées dans les meilleurs délais (idéalement dans la journée).",
        "Répondre aux demandes de vérification de l'équipe GazPoints sous 48h ouvrées.",
        "Informer GazPoints de tout changement d'adresse, de téléphone, de statut juridique ou de cessation d'activité.",
        "Ne pas céder, sous-louer ou partager son accès au tableau de bord.",
      ],
    },
    {
      id: "obligations-gazpoints",
      title: "7. Obligations de GazPoints",
      list: [
        "Maintenir le tableau de bord accessible et fonctionnel (sauf maintenance planifiée ou force majeure).",
        "Traiter les signalements d'informations erronées sur les disponibilités du vendeur sous 5 jours ouvrés.",
        "Ne pas communiquer les données du vendeur à des tiers (sauf obligations légales).",
        "Fournir une facture pour chaque paiement validé.",
        "Prévenir par email 30 jours avant toute modification tarifaire.",
      ],
    },
    {
      id: "remboursement",
      title: "8. Remboursement",
      paragraphs: [
        "Aucun remboursement n'est dû pour :",
        "Un remboursement (total ou partiel de la dernière mensualité) peut être envisagé uniquement en cas de :",
        "Toute demande de remboursement doit être formulée par écrit à contact@gazpoints.com sous 30 jours suivant l'événement.",
      ],
      list: [
        "Période d'abonnement déjà commencée (mensualité non proratisable).",
        "Suspension temporaire pour incident de paiement (service rétabli après régularisation).",
        "Résiliation volontaire du vendeur en cours de mois.",
        "Indisponibilité technique temporaire du tableau de bord (maintenance, panne corrigée sous 24h ouvrées).",
        "Faute exclusive de GazPoints empêchant l'utilisation du service pendant plus de 7 jours consécutifs.",
        "Force majeure empêchant durablement l'activité du vendeur (fermeture administrative, catastrophe naturelle), sur justificatifs.",
      ],
    },
    {
      id: "service-apres-vente",
      title: "9. Service après-vente et support",
      paragraphs: [
        "Le support vendeur est assuré par email : contact@gazpoints.com.",
        "Délai de réponse visé : 2 jours ouvrés (hors week-ends et jours fériés camerounais).",
        "Aucun support téléphonique ni sur site n'est inclus dans l'abonnement de base.",
      ],
    },
    {
      id: "modifications",
      title: "10. Modifications des CGV",
      paragraphs: [
        "GazPoints peut modifier les CGV (tarif, fonctionnalités, conditions) avec un préavis de 30 jours notifié par email.",
        "Le vendeur qui n'accepte pas les nouvelles conditions peut résilier avant leur entrée en vigueur. La poursuite de l'utilisation après la date d'effet vaut acceptation.",
      ],
    },
    {
      id: "droit-applicable",
      title: "11. Droit applicable et litiges",
      paragraphs: [
        "Les CGV sont régies par le droit camerounais (loi sur les communications électroniques, code de la consommation, OHADA).",
        "En cas de litige, une médiation amiable est privilégiée. À défaut, les tribunaux de Douala sont compétents.",
      ],
    },
    {
      id: "contact",
      title: "12. Contact",
      paragraphs: [
        "Pour toute question relative à l'abonnement, la facturation ou les CGV :",
      ],
      items: [
        { term: "Email", value: "contact@gazpoints.com" },
        { term: "Formulaire", value: "https://gazpoints.com/contact" },
        { term: "Adresse", value: "GazPoints – Douala, Cameroun" },
      ],
    },
  ],
}

export default function CGVPage() {
  return <PageLegale document={document} />
}