import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"
import { siteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: { absolute: "Conditions générales de vente | GazPoint" },
  description:
    "Conditions générales de vente de GazPoint : service gratuit d’information sur les points de vente de gaz, engagements, services payants aux vendeurs, rétractation, médiation et droit français.",
}

const document: LegalDocument = {
  eyebrow: "Conditions",
  title: "Conditions générales de vente",
  intro:
    "Les présentes conditions régissent l’utilisation du service GazPoint, application qui indique où trouver du gaz de cuisson disponible autour de soi. Elles s’appliquent aux utilisateurs du service ainsi qu’aux points de vente qui utilisent l’espace professionnel. Ta création de compte ou ta simple consultation du site vaut acceptation de ces conditions.",
  updated: "3 octobre 2026",
  sections: [
    {
      id: "objet",
      title: "Objet et champ d’application",
      paragraphs: [
        "GazPoint est un service d’information gratuit qui permet de rechercher les points de vente de gaz de cuisson déclarés autour d’un lieu, et de consulter pour chacun d’eux la distance, le statut de disponibilité, la date de la dernière mise à jour et, lorsqu’il est communiqué, le numéro du vendeur.",
        "Ces conditions s’appliquent à l’ensemble des usages du service : site internet " +
          siteUrl +
          ", application mobile et espace professionnel. Toute utilisation vaut acceptation pleine et entière. Si tu n’accepte pas ces conditions, tu ne dois pas utiliser le service.",
        "La version en vigueur est celle publiée sur le site. La date de dernière mise à jour figure en haut de cette page.",
      ],
      note: "Les conditions particulières qui encadrent un service payant souscrit par un point de vente complètent ces conditions et prévalent sur elles en cas de contradiction.",
    },
    {
      id: "nature-du-service",
      title: "GazPoint ne vend pas de gaz",
      paragraphs: [
        "GazPoint est un intermédiaire purement informatif. GazPoint ne vend pas de gaz, ne fixe pas les prix, ne négocie pas, n’assure ni la livraison, ni le transport, ni la reprise de bouteilles.",
        "Le contrat de vente du gaz est conclu directement entre toi et le point de vente de ton choix, aux prix, conditions et modalités propres à ce vendeur, et selon le droit qui lui est applicable. Ni GazPoint ni ses partenaires ne sont partie à ce contrat et ne peuvent en être tenue responsables.",
        "Les informations affichées (disponibilité, distance, horaires, prix éventuels, coordonnées) sont fournies à titre indicatif, à partir de signalements de vendeurs et des fiches officielles communiquées par l’administration. Elles ne constituent ni un engagement de vente, ni une garantie de disponibilité.",
      ],
      note: "Une disponibilité annoncée peut évoluer à tout moment : c’est pourquoi chaque point affiche la date et l’heure de sa dernière mise à jour, ainsi que l’auteur du signalement. En cas de doute, appelle le vendeur avant de te déplacer.",
    },
    {
      id: "acces",
      title: "Accès au service et gratuité",
      list: [
        "L’accès au service est gratuit, sans abonnement, sans commission sur une vente et sans demande de carte bancaire.",
        "La consultation des points de vente est possible sans compte. La création de compte est facultative et n’engage à rien.",
        "Un compte est créé avec un prénom et un numéro de téléphone vérifié une seule fois par SMS.",
        "Le service nécessite un téléphone compatible, une connexion internet ou réseau mobile et, si tu actives l’option, la localisation activée.",
        "GazPoint est conçu pour Douala. La couverture dépend des points de vente présents sur la plateforme.",
      ],
      paragraphs: [
        "Les services payants réservés aux points de vente sont décrits à la rubrique « Services payants aux points de vente ». Aucun montant n’est dû par les utilisateurs.",
      ],
    },
    {
      id: "engagements-utilisateur",
      title: "Tes engagements",
      paragraphs: ["En utilisant GazPoint, tu t’engages à :"],
      list: [
        "être majeur, ou utiliser le service avec l’accord écrit de ton représentant légal si tu es mineur ;",
        "fournir des informations exactes et à les tenir à jour ;",
        "conserver la confidentialité de ton mot de passe et de ton code de vérification, et nous signaler immédiatement toute utilisation non autorisée de ton compte ;",
        "utiliser le service à titre personnel et non professionnel, sauf si tu disposes d’un espace professionnel ;",
        "ne pas perturber, surcharger ou contourner le fonctionnement du service, ni en extraire massivement les données par un automate ;",
        "ne pas utiliser le service pour harceler, menacer ou diffamer un vendeur, ni publier de contenus illicites, diffamatoires ou haineux ;",
        "respecter les vendeurs et les tiers, et ne pas usurper l’identité de GazPoint.",
      ],
      note: "Le non-respect de ces engagements peut entraîner la suspension ou la fermeture du compte, sans préjudice des recours disponibles par la loi.",
    },
    {
      id: "engagements-gazpoint",
      title: "Nos engagements",
      list: [
        "Mettre à ta disposition les informations de points de vente déclarées, avec leur source et leur date.",
        "Afficher « à confirmer » lorsqu’une information n’a pas été actualisée récemment, plutôt que de la présenter comme certaine.",
        "Ne pas vendre ni céder tes données personnelles, et ne pas publier de publicité qui masque un résultat de recherche.",
        "Corriger les informations erronées et retirer les points de vente qui n’existent plus.",
        "Traiter toute réclamation reçue dans les meilleurs délais.",
      ],
      note: "Nous ne pouvons toutefois pas garantir l’exactitude d’une disponibilité, ni la présence effective d’une bouteille au moment où tu arrives. GazPoint affiche une information datée, pas une promesse.",
    },
    {
      id: "espace-professionnel",
      title: "Espace professionnel des points de vente",
      paragraphs: [
        "Un point de vente peut ouvrir un espace professionnel pour signaler son stock, tenir ses informations à jour et accéder, le cas échéant, aux services payants (mise en avant, espace dédié, publicité).",
        "L’accès à l’espace professionnel est gratuit. Il est réservé aux points de vente exerçant une activité régulière de vente de gaz : [CONDITIONS D’ACCÈS À L’ESPACE PROFESSIONNEL, À PRÉCISER, PAR EXEMPLE JUSTIFICATIF D’ACTIVITÉ]. Il est personnel et ne peut être cédé.",
      ],
    },
    {
      id: "services-payants",
      title: "Services payants aux points de vente",
      paragraphs: [
        "Les services payants (mise en avant dans les résultats, espace dédié, emplacement publicitaire) sont réservés aux points de vente et font l’objet d’un devis écrit ou de conditions particulières acceptées avant toute commande.",
        "Ces conditions précisent la durée, la nature exacte du service, le prix en francs CFA (FCFA) ou en euros, les modalités et délais de paiement, les obligations de chaque partie et les conditions de résiliation. Les prix sont indiqués hors taxes, sauf mention contraire : la taxe applicable est [TAUX OU RÉGIME APPLICABLE, À PRÉCISER, Y COMPRIS L’AUTOLIQUIDATION DE LA TVA PAR LE PRESTATAIRE SI LA FACTURATION EST ADDRESSÉE À UN CLIENT ÉTRANGER].",
        "Le vendeur s’acquitte de ses obligations fiscales propres, notamment l’enregistrement, les licences et taxes applicables à son activité. Les factures sont établies et conservées selon la réglementation fiscale française et mentionnent les informations requises à ce titre.",
      ],
      list: [
        "Le paiement est exigé selon l’échéancier indiqué dans les conditions particulières ; aucun prélèvement n’a lieu sans accord écrit préalable.",
        "Les demandes de paiement sont adressées par email à [ADRESSE EMAIL DE FACTURATION] avec la référence de la commande.",
        "Tout retard de paiement entraîne de plein droit des pénalités de retard au taux légal, ainsi qu’une indemnité forfaitaire pour frais de recouvrement de 40 €.",
        "Les services sont publiés au plus tard [DÉLAI DE PUBLICATION À PRÉCISER, PAR EXEMPLE 5 JOURS OUVRÉS] après réception du paiement.",
        "Le vendeur garantit l’exactitude des informations qu’il transmet et dispose des autorisations nécessaires à leur publication, notamment pour l’usage de sa raison sociale, de ses coordonnées et de tout contenu transmis.",
      ],
      note: "Ces services ne garantissent aucune vente : ils ne garantissent pas qu’une position dans les résultats ou qu’une publicité te procurera un client. Ces services sont réservés aux professionnels ; ils ne sont pas soumis au droit de rétractation des consommateurs.",
    },
    {
      id: "publicite",
      title: "Publicité",
      paragraphs: [
        "L’accès au service reste gratuit. Son financement est assuré par les services proposés aux points de vente et par des espaces publicitaires réservés, qui n’interfèrent pas avec les résultats de recherche : une annonce n’est jamais présentée comme une disponibilité de gaz.",
        "Aucun contenu publicitaire ne se présente comme une recommandation de GazPoint, et aucune publicité n’est adressée aux mineurs.",
      ],
    },
    {
      id: "propriete-intellectuelle",
      title: "Propriété intellectuelle",
      paragraphs: [
        "La marque GazPoint, son logo, le design de l’application, les textes, les bases de données et le code du service appartiennent à [NOM DE LA SOCIÉTÉ]. L’utilisation du service ne t’accorde qu’une licence personnelle, limitée et non cessible, d’accès à ces éléments.",
        "Il t’est interdit de copier, revendre, dépouiller ou exploiter le service, ou d’utiliser une marque dérivée, sans autorisation écrite préalable. Une demande peut être adressée à [ADRESSE EMAIL DE CONTACT].",
      ],
    },
    {
      id: "garanties",
      title: "Garanties légales",
      paragraphs: [
        "Lorsque GazPoint fournit un service payant, il est tenu de la garantie légale de conformité dans les conditions prévues par les articles L217-3 et suivants du Code de la consommation, pour une durée de deux ans à compter de la fourniture. La garantie légale contre les vices cachés ne s’applique pas aux contrats de fourniture de contenu numérique.",
        "Lorsque tu souscris un service payant, tu peux mettre GazPoint en demeure, par lettre recommandée avec accusé de réception ou email, de remédier au défaut dans un délai de trente jours. À défaut de réponse ou de remise en état conforme dans ce délai, tu peux demander la résolution du contrat et le remboursement de ce qui a été payé, sans préjudice de ton droit d’obtenir des dommages-et-intérêts.",
      ],
      note: "L’accès au service gratuit est fourni de la meilleure façon possible, sans garantie de disponibilité continue : une interruption liée à la maintenance ou à une panne des réseaux ne peut donner lieu à aucune indemnité, le service étant gratuit.",
    },
    {
      id: "responsabilite",
      title: "Responsabilité et limitation",
      paragraphs: [
        "GazPoint s’efforce d’assurer la disponibilité du service et l’exactitude des informations, mais sa responsabilité est limitée aux manquements directs et prouvés qu’elle aurait commis dans la fourniture du service.",
        "GazPoint ne répond pas des dommages liés à une information de disponibilité inexacte, à une absence de gaz au moment de l’achat, au déplacement effectué sur la base de l’information affichée, à une panne de réseau, à une interruption de maintenance, à un cas de force majeure, ni du comportement d’un vendeur ou d’un tiers.",
        "Aucune clause des présentes conditions ne limite ou n’exclut la responsabilité de GazPoint pour une faute lourde ou intentionnelle, pour un dommage corporel, ni les droits que la loi française reconnaît impérativement au consommateur. Conformément à l’article L212-1-1 du Code de la consommation, aucune clause ne peut déroger aux dispositions d’ordre public relatives à la responsabilité du professionnel.",
      ],
    },
    {
      id: "retractation",
      title: "Droit de rétractation",
      paragraphs: [
        "L’accès au service est gratuit : il n’existe donc aucune vente à distance de contenu numérique payante à ton endroit, et le droit de rétractation de quatorze jours ne trouve pas à s’appliquer à ton bénéfice.",
        "Si GazPoint te propose ultérieurement une offre payante à titre de consommateur, tu disposerais d’un délai de quatorze jours pour exercer ton droit de rétractation à compter de la conclusion du contrat, sans avoir à motiver ta décision.",
        "Lorsque tu commandes un service dont l’exécution commence immédiatement après la commande (mise en avant immédiate dans les résultats, par exemple), tu perds ce droit si tu as expressément demandé cette exécution immédiate et si tu as confirmé avoir connaissance de la perte de ce droit : GazPoint te demandera alors une confirmation expresse avant la commande.",
      ],
    },
    {
      id: "suspension",
      title: "Suspension et fermeture",
      paragraphs: [
        "Tu peux supprimer ton compte à tout moment, depuis l’application ou en écrivant à [ADRESSE EMAIL DE CONTACT].",
        "GazPoint peut suspendre un compte en cas de violation des présentes conditions, de fraude, d’atteinte à la sécurité du service ou sur demande d’une autorité compétente. Une fermeture pour motif de sécurité est immédiate et sans préavis ; les autres mesures sont notifiées à l’adresse électronique du compte.",
        "La fermeture d’un espace professionnel met fin à la publication de ses informations, sans effet sur les factures déjà émises ni sur les engagements en cours, ni sur le remboursement dû au titre des services non encore fournis.",
      ],
    },
    {
      id: "modifications",
      title: "Modification des conditions",
      paragraphs: [
        "Ces conditions peuvent être modifiées pour tenir compte d’une évolution du service ou de la loi. La date de dernière mise à jour figure en haut de cette page. En cas de modification importante, GazPoint t’en informe dans l’application ou par email avant son entrée en vigueur. En continuant à utiliser le service après cette date, tu acceptes la version mise à jour.",
      ],
    },
    {
      id: "donnees-personnelles",
      title: "Données personnelles",
      paragraphs: [
        "Le traitement de tes données personnelles est décrit dans notre politique de confidentialité, qui fait partie intégrante des présentes conditions.",
      ],
    },
    {
      id: "droit-applicable",
      title: "Droit applicable, réclamation et médiation",
      paragraphs: [
        "Les présentes conditions sont régies par le droit français.",
        "Avant toute action judiciaire, adresse ta réclamation à [ADRESSE EMAIL DE CONTACT] ou par courrier à [ADRESSE COMPLÈTE DU SIÈGE]. Une réponse écrite te sera adressée dans un délai de trente (30) jours.",
        "En cas de différend avec un point de vente, la médiation de la consommation peut être saisie : le médiateur désigné par GazPoint est [NOM DU MÉDIATEUR DE LA CONSOMMATION, ADRESSE POSTALE ET SITE WEB]. Tu peux aussi recourir gratuitement au médiateur de la consommation du pays du vendeur concerné.",
        "À défaut d’accord, les tribunaux français compétents seront seuls compétents. Conformément aux dispositions impératives du Code de procédure civile et du Code de la consommation, un consommateur agissant à titre non professionnel peut néanmoins saisir le tribunal de son lieu de résidence, en plus du tribunal du siège de GazPoint.",
      ],
      note: "Ces conditions ne privent pas le consommateur des droits que la loi lui reconnaît impérativement, notamment le droit d’agir en justice pour la défense de ses droits.",
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "Pour toute question relative à ces conditions, écris à [ADRESSE EMAIL DE CONTACT] ou passe par la page de contact accessible depuis " +
          siteUrl +
          "/contact. L’éditeur du service est [NOM DE LA SOCIÉTÉ], [ADRESSE COMPLÈTE DU SIÈGE], RCS [VILLE D’IMMATRICULATION] [NUMÉRO SIREN].",
      ],
    },
  ],
}

export default function ConditionsGeneralesVentePage() {
  return <PageLegale document={document} />
}