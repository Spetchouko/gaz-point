import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"
import { siteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: { absolute: "Politique de confidentialité | GazPoint" },
  description:
    "Comment GazPoint collecte, utilise, conserve et protège tes données personnelles : compte, recherches, localisation, transferts hors UE, droits RGPD et contacts.",
}

const document: LegalDocument = {
  eyebrow: "Vie privée",
  title: "Politique de confidentialité",
  intro:
    `GazPoint est un service gratuit d’information sur les points de vente de gaz de cuisson. Cette politique explique quelles données personnelles sont collectées, pourquoi, sur quelle base légale, combien de temps elles sont conservées et comment exercer tes droits. Elle s’applique au site ${siteUrl}, à l’application mobile GazPoint et à l’espace professionnel des points de vente.`,
  updated: "3 octobre 2026",
  sections: [
    {
      id: "responsable",
      title: "Qui traite tes données",
      paragraphs: [
        "Le responsable du traitement est [NOM DE LA SOCIÉTÉ], [FORME JURIDIQUE] au capital de [CAPITAL SOCIAL EN €], dont le siège social est situé [ADRESSE COMPLÈTE DU SIÈGE, AU CAMEROUN], immatriculée sous le numéro [NUMÉRO SIREN] au RCS de [VILLE D’IMMATRICULATION] et dont le numéro de TVA intracommunautaire est [FR + NUMÉRO DE TVA INTRACOMMUNAUTAIRE].",
        "Contact pour toute question relative à tes données personnelles : [ADRESSE EMAIL DE CONTACT] en précisant « Données personnelles » dans l’objet du message, ou par courrier à [ADRESSE COMPLÈTE DU SIÈGE]. Tu peux aussi passer par la page de contact accessible depuis " +
        siteUrl +
        "/contact.",
      ],
      items: [
        {
          term: "Délégué à la protection des données",
          value:
            "[NOM ET COORDONNÉES DU DPO, SI DÉSIGNÉ] — À CE JOUR, AUCUN DPO N’EST DÉSIGNÉ : LES DEMANDES SONT À ADRESSER AU RESPONSABLE DE TRAITEMENT.",
        },
      ],
    },
    {
      id: "principes",
      title: "Nos principes",
      list: [
        "Minimisation : nous ne demandons que ce qui est nécessaire pour faire fonctionner le service.",
        "Aucune revente : tes données ne sont ni vendues, ni louées, ni cédées à des tiers pour de la publicité.",
        "Aucun cookie publicitaire : le service ne dépose aucun cookie de mesure d’audience ni traceur de réseau social.",
        "Transparence : chaque information affichée dans le service est datée et attribuée à sa source.",
      ],
      paragraphs: [
        "GazPoint applique le Règlement (UE) 2016/679 (RGPD) et la loi française du 21 juin 2018 dite « Informatique et Libertés », sous le contrôle de la Commission nationale de l’informatique et des libertés (CNIL).",
        "Le service s’adresse principalement à des utilisateurs situés au Cameroun. Lorsque la législation camerounaise en matière de protection des données à caractère personnel s’applique aussi à ta situation, nous la prenons en compte.",
      ],
    },
    {
      id: "donnees-visiteur",
      title: "Données collectées sans compte",
      paragraphs: [
        "Tu peux consulter les points de vente autour d’un quartier sans créer de compte. Les données suivantes sont alors traitées :",
      ],
      items: [
        {
          term: "Recherche",
          value:
            "Marque, format de bouteille (6 kg, 12,5 kg, 15 kg) et zone saisie : quartier, rue ou point de repère.",
        },
        {
          term: "Position",
          value:
            "Uniquement si tu actives l’option « Utiliser ma position ». Le consentement est demandé au moment de l’activation et peut être refusé : la saisie d’une zone au clavier suffit.",
        },
        {
          term: "Données techniques",
          value:
            "Adresse IP, type de navigateur et de système, pages consultées, horodatage et durée de consultation, conservés dans les journaux du serveur pour la sécurité et le bon fonctionnement du site.",
        },
      ],
      note: "Aucune donnée sensible (santé, opinions politiques, convictions religieuses, appartenance syndicale, données biométriques, données génétiques) n’est collectée.",
    },
    {
      id: "donnees-compte",
      title: "Données collectées avec le compte",
      paragraphs: [
        "Lorsque tu crées un compte, GazPoint traite en plus :",
      ],
      items: [
        { term: "Identité", value: "Prénom et numéro de téléphone." },
        {
          term: "Vérification",
          value:
            "Un code de vérification est envoyé par SMS à ce numéro pour confirmer qu’il est le tien. Le numéro n’est ni vendu, ni transmis à des tiers à des fins commerciales.",
        },
        {
          term: "Activité",
          value:
            "Historique de tes recherches, points de vente consultés et favoris, uniquement pour ton compte.",
        },
      ],
      note: "GazPoint ne demande ni carte bancaire, ni adresse complète, ni pièce d’identité. Ces champs sont facultatifs ou ne sont pas collectés.",
    },
    {
      id: "donnees-vendeurs",
      title: "Données de l’espace professionnel",
      paragraphs: [
        "Si tu gères un point de vente, l’espace professionnel permet de signaler ton stock, de tenir tes informations à jour et, le cas échéant, de profiter des services payants. Les données traitées sont alors :",
      ],
      list: [
        "Raison sociale ou nom du gérant, nom commercial et adresse du point de vente.",
        "Numéro de téléphone professionnel, adresse électronique professionnelle et WhatsApp.",
        "Documents d’identification du commerce (registre de commerce, NIU, attestation d’exploitation) et coordonnées bancaires pour la facturation.",
        "Historique des changements de statut de disponibilité.",
      ],
      note: "Ces données sont visibles publiquement dans les résultats de recherche, à l’exception des documents d’identification et des coordonnées bancaires, qui restent confidentiels.",
    },
    {
      id: "finalites",
      title: "Pourquoi tes données sont utilisées",
      items: [
        {
          term: "Exécution du contrat (art. 6.1.b RGPD)",
          value:
            "Créer et gérer ton compte, afficher les points de vente correspondant à ta recherche, calculer les distances et te permettre de les appeler.",
        },
        {
          term: "Intérêt légitime (art. 6.1.f RGPD)",
          value:
            "Sécuriser le service, prévenir la fraude et les abus, diagnostiquer les incidents, mesurer l’usage de l’application de façon agrégée et non nominative, améliorer la couverture de Douala.",
        },
        {
          term: "Consentement (art. 6.1.a RGPD)",
          value:
            "Utiliser ta position le temps de la recherche. Tu peux retirer ce consentement à tout moment en n’activant plus l’option ou en supprimant le compte.",
        },
        {
          term: "Obligation légale (art. 6.1.c RGPD)",
          value:
            "Conserver les factures et les pièces comptables pendant la durée requise par la réglementation fiscale française.",
        },
      ],
      paragraphs: [
        "Aucune donnée n’est utilisée pour de la publicité ciblée, pour l’ouverture d’un dossier de crédit ou pour une décision automatisée produisant des effets juridiques à ton égard.",
        "Les champs marqués d’un astérisque ou demandés explicitement sont obligatoires : sans eux, le service ne peut pas fonctionner. Tous les autres sont facultatifs.",
      ],
    },
    {
      id: "cookies",
      title: "Cookies et traceurs",
      paragraphs: [
        "Le service fonctionne sans cookie publicitaire, sans cookie de mesure d’audience et sans traceur de réseau social. Seules des données techniques nécessaires au fonctionnement et à la sécurité du service sont enregistrées dans les journaux du serveur.",
        "Aucune bannière de consentement n’est donc nécessaire aujourd’hui. Si un outil de mesure d’audience, une carte interactive ou un traceur tiers étaient ajoutés ultérieurement, cette politique serait mise à jour avant leur activation et, lorsque la loi l’exige, un module de consentement te permettrait de les refuser.",
      ],
    },
    {
      id: "destinataires",
      title: "Qui a accès à tes données",
      paragraphs: [
        "Tes données sont accessibles au seul personnel autorisé de [NOM DE LA SOCIÉTÉ], dans la limite de ce dont il a besoin pour faire fonctionner le service, et aux sous-traitants suivants, liés à nous par un contrat conforme à l’article 28 du RGPD lorsqu’ils traitent tes données pour notre compte :",
        "Les points de vente visibles dans les résultats ne reçoivent pas ton identité, ta position exacte ni ton historique de recherches. Le numéro du vendeur affiché est une information publique de l’établissement.",
      ],
      items: [
        {
          term: "Hébergement",
          value:
            "Vercel Inc. (340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis), qui héberge le site, l’application, l’API et les bases de données. Contact pour la protection des données chez Vercel : privacy@vercel.com.",
        },
        {
          term: "Envoi de SMS",
          value:
            "[PRESTATAIRE DE SERVICES SMS, À COMPLÉTER], qui reçoit uniquement ton numéro de téléphone et le code de vérification, le temps de l’envoi.",
        },
        {
          term: "Cartographie",
          value:
            "[PRESTATAIRE DE CARTOGRAPHIE, À COMPLÉTER], utilisé uniquement pour afficher la carte et l’itinéraire que tu demandes.",
        },
        {
          term: "Paiement (vendeurs)",
          value:
            "[PRESTATAIRE DE PAIEMENT, À COMPLÉTER], uniquement dans le cadre des services professionnels payants.",
        },
        {
          term: "Liste complète des sous-traitants",
          value:
            "[PAGE OU LISTE DES SOUS-TRAITANTS, À COMPLÉTER ET TENUE À JOUR]",
        },
      ],
    },
    {
      id: "transferts",
      title: "Transferts en dehors de l’Union européenne",
      paragraphs: [
        "Tes données sont hébergées chez Vercel Inc., dont les installations principales sont situées aux États-Unis. Vercel permet de choisir une région d’hébergement européenne (Francfort) : la région utilisée est [À CONFIRMER].",
        "Lorsque le traitement est réalisé aux États-Unis, pays pour lequel la Commission européenne n’a pas estimé le niveau de protection adéquat, le transfert est encadré par des garanties appropriées : Vercel est certifié au cadre UE–États-Unis de protection des données (EU-U.S. Data Privacy Framework) et applique les clauses contractuelles types de la Commission européenne. Vercel s’engage également à ne pas traiter tes données pour ses propres finalités et à les supprimer à la fin du service.",
        "Pour le compte commercial souscrit chez Vercel, un contrat de traitement de données (Data Processing Addendum) peut être signé afin de bénéficier de ces garanties : [À CONFIRMER SELON LE FORFAIT]. Tu peux en demander une copie, ainsi que le descriptif des garanties mises en œuvre, auprès de [ADRESSE EMAIL DE CONTACT].",
      ],
      note: "Aucun transfert de tes données vers un pays tiers n’est effectué à des fins publicitaires.",
    },
    {
      id: "conservation",
      title: "Combien de temps tes données sont conservées",
      items: [
        {
          term: "Compte et profil",
          value:
            "Pendant la durée du compte, puis 30 jours après la demande de suppression, avant anonymisation.",
        },
        {
          term: "Historique de recherches",
          value: "Jusqu’à la suppression du compte, ou 13 mois maximum pour un compte inactif.",
        },
        {
          term: "Journaux du serveur",
          value: "12 mois maximum.",
        },
        {
          term: "Code de vérification SMS",
          value: "Le temps de la vérification, puis suppression immédiate.",
        },
        {
          term: "Données professionnelles et factures",
          value:
            "Durée de la relation commerciale, puis 10 ans à compter de la dernière facture, conformément aux obligations fiscales françaises.",
        },
        {
          term: "Demandes et réclamations",
          value: "3 ans à compter du dernier échange.",
        },
      ],
      paragraphs: [
        "À l’issue de ces durées, les données sont supprimées ou anonymisées de façon irréversible : elles ne peuvent plus être rattachées à une personne.",
      ],
    },
    {
      id: "securite",
      title: "Sécurité",
      list: [
        "Chiffrement des échanges entre ton téléphone et nos serveurs (HTTPS).",
        "Accès aux bases de données restreint aux personnes habilitées et protégé par des identifiants.",
        "Mots de passe stockés sous forme de condensats, jamais en clair.",
        "Sauvegardes régulières et limitation des accès aux données personnelles.",
        "Prise en compte de la protection de la vie privée dès la conception des fonctionnalités.",
      ],
      paragraphs: [
        "En cas de violation de données à caractère personnel susceptible d’engendrer un risque élevé pour tes droits et libertés, GazPoint en informe la CNIL dans les 72 heures et t’en informe dans les meilleurs délais, comme le prévoit le RGPD.",
      ],
    },
    {
      id: "droits",
      title: "Tes droits",
      paragraphs: [
        "Conformément au RGPD et à la loi Informatique et Libertés, tu peux à tout moment :",
      ],
      list: [
        "obtenir la confirmation que tes données sont traitées et en recevoir une copie (droit d’accès) ;",
        "faire rectifier des données inexactes ou incomplètes (droit de rectification) ;",
        "demander l’effacement de tes données (droit à l’oubli) ;",
        "demander une limitation temporaire du traitement (droit de limitation) ;",
        "recevoir tes données dans un format structuré et lisible par machine (portabilité) ;",
        "t’opposer à un traitement fondé sur l’intérêt légitime ou à la prospection ;",
        "définir le sort de tes données après ton décès (directives relatives au sort des données après décès) ;",
        "retirer ton consentement à tout moment, sans que cela remette en cause la licéité du traitement déjà effectué.",
      ],
      closing: [
        "Exerce ces droits par email à [ADRESSE EMAIL DE CONTACT], en précisant l’adresse électronique ou le numéro de téléphone associé à ton compte. Nous répondons dans un délai maximal d’un mois.",
        "Si tu estimes qu’un traitement de tes données n’est pas conforme, tu peux saisir la Commission nationale de l’informatique et des libertés (CNIL), 3 place de Fontenoy – TSA 80715 – 75334 Paris Cedex 07, ou déposer une plainte sur www.cnil.fr. Tu peux également saisir l’autorité de contrôle du pays où tu résides.",
      ],
    },
    {
      id: "suppression",
      title: "Suppression du compte",
      paragraphs: [
        "Tu peux supprimer ton compte à tout moment depuis l’application, ou en écrivant à [ADRESSE EMAIL DE CONTACT].",
        "La suppression entraîne la désactivation définitive de ton compte et l’effacement de tes données personnelles, à l’exception de celles que la loi nous oblige à conserver, notamment les pièces comptables.",
        "Lorsque l’application est distribuée via Google Play ou l’App Store, la désinstallation de l’application ne supprime pas ton compte : tes données restent enregistrées chez nous jusqu’à ce que tu demandes la suppression du compte ou que nous devions les effacer.",
      ],
    },
    {
      id: "mineurs",
      title: "Mineurs",
      paragraphs: [
        "Le service s’adresse aux personnes majeures. Le traitement des données d’un mineur de moins de quinze ans est donc exclu. Un mineur de quinze à dix-sept ans ne peut utiliser GazPoint qu’avec l’accord écrit d’un représentant légal, qui devient alors responsable du respect des présentes règles.",
      ],
    },
    {
      id: "modifications",
      title: "Modifications de la politique",
      paragraphs: [
        "Cette politique peut être mise à jour pour refléter de nouvelles fonctionnalités, de nouvelles obligations légales ou une nouvelle politique d’hébergement. La date de dernière mise à jour figure en haut de cette page. En cas de changement important, une information te sera adressée dans l’application ou par email.",
      ],
    },
  ],
}

export default function PolitiqueConfidentialitePage() {
  return <PageLegale document={document} />
}