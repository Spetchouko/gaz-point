import type { Metadata } from "next"
import { PageLegale, type LegalDocument } from "@/app/_components/page-legale"
import { siteUrl } from "@/lib/site"

export const metadata: Metadata = {
  title: { absolute: "Mentions légales | GazPoint" },
  description:
    "Mentions légales de GazPoint : éditeur du site, hébergement Vercel, propriété intellectuelle, responsabilité, signalement de contenus et droit applicable.",
}

const document: LegalDocument = {
  eyebrow: "Informations légales",
  title: "Mentions légales",
  intro:
    "Les présentes mentions légales renseignent l’éditeur, l’hébergement et les conditions d’utilisation du site et de l’application GazPoint, service d’information sur les points de vente de gaz de cuisson. Elles doivent être lues avec nos conditions générales de vente et notre politique de confidentialité.",
  updated: "3 octobre 2026",
  sections: [
    {
      id: "editeur",
      title: "Éditeur du site et de l’application",
      items: [
        { term: "Dénomination sociale", value: "[NOM DE LA SOCIÉTÉ]" },
        {
          term: "Forme juridique",
          value: "[FORME JURIDIQUE : SASU, SARL, ENTREPRISE INDIVIDUELLE…]",
        },
        { term: "Capital social", value: "[CAPITAL SOCIAL EN €]" },
        { term: "Siège social", value: "[ADRESSE COMPLÈTE DU SIÈGE, AU CAMEROUN]" },
        { term: "Immatriculation", value: "[NUMÉRO SIREN] — RCS [VILLE D’IMMATRICULATION]" },
        { term: "SIRET (siège)", value: "[NUMÉRO SIRET À 14 CHIFFRES]" },
        {
          term: "TVA intracommunautaire",
          value: "[FR + NUMÉRO DE TVA INTRACOMMUNAUTAIRE]",
        },
        { term: "Adresse électronique", value: "[ADRESSE EMAIL DE CONTACT]" },
        { term: "Téléphone", value: "[NUMÉRO DE TÉLÉPHONE]" },
        {
          term: "Directeur de la publication",
          value: "[NOM ET PRÉNOM DU DIRECTEUR DE LA PUBLICATION]",
        },
        { term: "Adresse du service", value: siteUrl },
      ],
      paragraphs: [
        `La société [NOM DE LA SOCIÉTÉ], [FORME JURIDIQUE] au capital de [CAPITAL SOCIAL EN €], immatriculée sous le numéro [NUMÉRO SIREN] au registre du commerce et des sociétés de [VILLE D’IMMATRICULATION], édite et exploite le service GazPoint, accessible depuis le site ${siteUrl} et l’application mobile GazPoint.`,
        "Le directeur de la publication est le responsable de l’information éditoriale du service. Il peut être contacté à l’adresse électronique et au téléphone indiqués ci-dessus.",
        "Le service s’adresse principalement aux habitants de Douala et du Cameroun. Son exploitation et sa rédaction sont assurées depuis le Cameroun.",
        "Les ventes de gaz de cuisson, leurs prix et leur disponibilité relèvent du droit applicable dans le pays du point de vente, et non du droit français : celui-ci ne régit que les relations entre GazPoint et ses utilisateurs.",
      ],
    },
    {
      id: "hebergement",
      title: "Hébergement",
      items: [
        { term: "Hébergeur", value: "Vercel Inc." },
        {
          term: "Adresse postale",
          value: "340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis",
        },
        {
          term: "Siège social de l’hébergeur",
          value: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
        },
        { term: "Site web", value: "https://vercel.com" },
        { term: "Contact données personnelles", value: "privacy@vercel.com" },
        {
          term: "Région d’hébergement utilisée",
          value:
            "[À CONFIRMER : UE (Francfort) OU ÉTATS-UNIS, SELON LE FORFAIT ET LA RÉGION CHOISIS]",
        },
        {
          term: "Encadrement contractuel",
          value:
            "[CONTRAT DE TRAITEMENT DE DONNÉES (DPA) VERCEL — À SOUSCRIRE POUR BÉNÉFICIER DES GARANTIES, DISPONIBLE SUR LES FORFAITS PRO ET ENTREPRISE]",
        },
      ],
      paragraphs: [
        "L’ensemble des fonctions du service (site, application mobile, API et bases de données) est hébergé par Vercel Inc., société de droit américain. Vercel permet de choisir une région d’hébergement européenne (Francfort) ou américaine : la région réellement utilisée est [À CONFIRMER].",
        "Lorsque l’hébergement est réalisé aux États-Unis, un transfert de données hors de l’Union européenne a lieu. Ce transfert est encadré par des garanties appropriées : Vercel est certifié au cadre UE–États-Unis de protection des données et applique les clauses contractuelles types de la Commission européenne. Le détail figure dans la rubrique « Transferts en dehors de l’Union européenne » de notre politique de confidentialité.",
      ],
    },
    {
      id: "nature-du-service",
      title: "Nature du service",
      paragraphs: [
        "GazPoint est un service d’information gratuit. Il permet de consulter les points de vente de gaz de cuisson déclarés autour d’un lieu donné, avec leur distance, leur statut de disponibilité, la date de leur dernière mise à jour et, lorsqu’il est communiqué, le numéro du vendeur.",
        "GazPoint ne vend pas de gaz, ne négocie pas de prix, n’assure pas la livraison et n’est pas partie au contrat de vente du gaz. La vente du gaz se conclut directement entre l’utilisateur et le point de vente, dans les conditions définies par ce dernier et selon le droit qui lui est applicable. Les informations affichées sont indicatives et ne constituent ni un engagement de vente, ni une garantie de disponibilité.",
      ],
      note: "Pour utiliser le service, consulte nos conditions générales de vente et notre politique de confidentialité.",
    },
    {
      id: "propriete-intellectuelle",
      title: "Propriété intellectuelle",
      paragraphs: [
        "La marque GazPoint, son logo représentant une bouteille de gaz domestique, les couleurs, les textes, les illustrations, l’arborescence du site, le code source de l’application et l’ensemble des éléments du service sont la propriété exclusive de [NOM DE LA SOCIÉTÉ], sauf mention contraire.",
        "Toute reproduction, représentation, modification, adaptation ou exploitation, totale ou partielle, de ces éléments, par quelque procédé et sur quelque support que ce soit, est interdite sans autorisation écrite préalable. Une demande d’autorisation peut être adressée à [ADRESSE EMAIL DE CONTACT].",
        "Les marques, logos et noms de commerce des marques de gaz (Tradex, Total, SCTM, Bocom, et tout autre marque citée) ainsi que les dénominations de points de vente appartiennent à leurs titulaires respectifs. Leur mention sur le service a une seule finalité descriptive : identifier les points de vente où ces produits sont proposés. GazPoint n’exerce aucun droit sur ces marques.",
      ],
    },
    {
      id: "contenus-tiers",
      title: "Contenus publiés par les points de vente",
      paragraphs: [
        "Les informations concernant les points de vente (raison sociale, adresse, horaires, numéro de téléphone, statut de disponibilité) sont transmises et publiées par les points de vente eux-mêmes, dans leur espace professionnel. GazPoint en vérifie la cohérence et retire les contenus manifestement illicites ou trompeurs, sans être tenu de contrôler l’exactitude de chaque information.",
        "Si tu constates un contenu illicite, une erreur factuelle ou une atteinte à tes droits dans les informations publiées par un point de vente, signale-le à [ADRESSE EMAIL DE CONTACT] en précisant le nom du point de vente et le lien vers sa fiche. Nous traitons les signalements dans les meilleurs délais et pouvons masquer le contenu concerné le temps de l’examiner.",
      ],
    },
    {
      id: "responsabilite",
      title: "Responsabilité",
      paragraphs: [
        "GazPoint met en œuvre les moyens raisonnables pour assurer l’exactitude et la disponibilité des informations publiées. Toutefois, les données de disponibilité reposent sur des signalements de vendeurs et sur les fiches officielles communiquées par l’administration : elles peuvent être incomplètes, anciennes ou erronées.",
        "GazPoint ne saurait être tenue responsable des décisions d’achat prises sur la base des informations affichées, des préjudices résultant de l’indisponibilité ponctuelle du service, d’une interruption liée à la maintenance ou à une panne des réseaux ou des opérateurs, ni des contenus transmis par les utilisateurs et les vendeurs dans l’espace professionnel.",
        "Aucune clause de ces mentions légales ne peut limiter ou exclure la responsabilité de GazPoint pour une faute lourde ou intentionnelle, pour un dommage corporel, ni les droits que la loi française reconnaît impérativement au consommateur.",
      ],
    },
    {
      id: "accessibilite",
      title: "Accessibilité",
      paragraphs: [
        "Le service est conçu pour être consultable sur téléphone mobile et sur ordinateur. Dans la mesure du possible, les contenus sont rédigés de façon claire et les interfaces évitent les obstacles visuels courants.",
        "GazPoint n’est pas un service public : le Référentiel général d’amélioration de l’accessibilité (RGAA) ne lui est donc pas opposable. Nous nous efforçons néanmoins d’en respecter les principes, notamment la navigation au clavier, le contraste des couleurs et la lisibilité des textes.",
        "Si tu rencontres une difficulté d’accès à une information, signale-la à [ADRESSE EMAIL DE CONTACT] : nous corrigeons le défaut d’interface rencontré et l’information concernée.",
      ],
    },
    {
      id: "liens",
      title: "Liens",
      paragraphs: [
        "Le service peut contenir des liens vers des sites externes, notamment vers des applications de cartographie pour l’itinéraire ou vers le site d’un vendeur. Ces liens sont proposés par commodité : GazPoint n’exerce aucun contrôle sur ces sites et n’assume aucune responsabilité quant à leur contenu.",
      ],
    },
    {
      id: "donnees-personnelles",
      title: "Données personnelles",
      paragraphs: [
        "Le traitement de tes données personnelles est décrit dans notre politique de confidentialité, qui fait partie intégrante de ces mentions légales. Tu y trouveras les finalités, les bases légales, les durées de conservation, les destinataires et les modalités d’exercice de tes droits.",
      ],
    },
    {
      id: "droit-applicable",
      title: "Droit applicable et juridiction",
      paragraphs: [
        "Les présentes mentions légales sont régies par le droit français. En cas de différend relatif à l’interprétation ou à l’exécution du service, une solution amiable sera recherchée avec [NOM DE LA SOCIÉTÉ] dans un délai de trente (30) jours à compter de la première réclamation écrite.",
        "À défaut d’accord, les tribunaux français compétents seront seuls compétents. Conformément aux dispositions impératives du droit français, un consommateur agissant à titre non professionnel peut néanmoins saisir le tribunal de son lieu de résidence ou le tribunal du siège de GazPoint.",
      ],
      note: "La vente du gaz n’est pas régie par ces mentions légales : elle est conclue directement entre toi et le point de vente, selon le droit applicable à ce point de vente.",
    },
    {
      id: "contact",
      title: "Contact",
      paragraphs: [
        "Pour toute question relative aux présentes mentions légales, à l’édition du site ou à l’exercice de tes droits, écris à [ADRESSE EMAIL DE CONTACT] ou passe par la page de contact accessible depuis " +
        siteUrl +
        "/contact.",
      ],
    },
  ],
}

export default function MentionsLegalesPage() {
  return <PageLegale document={document} />
}