# Charte éditoriale — GazPoints

## 1. Langue officielle

- **Langue** : français (fr-FR)
- **Variante** : français standard, adapté au contexte camerounais
- **Site bilingue** : français (par défaut) et anglais (via `locales/en.json`)

## 2. Niveau de langage

- **Registre** : professionnel, simple, naturel, accessible
- **Ton** : courtois, clair, direct, sans jargon inutile
- **Pronom de politesse** : **vous** systématiquement (sauf citations ou témoignages verbatim)
- **Éviter** : le tutoiement, le langage SMS, les anglicismes inutiles

## 3. Règles de ponctuation et typographie

- Espace insécurisée avant `: ; ! ? ;` en français
- Guillemets français `« »` avec espaces intérieures
- Apostrophe typographique `'` (U+2019), pas de `&apos;` ni de `'`
- Accents obligatoires sur toutes les majuscules : `À`, `É`, `È`, `Ç`, `Ô`, etc.
- Majuscule en début de phrase, après point final
- Pas de majuscule inutile en milieu de phrase

## 4. Terminologie officielle GazPoints

| Concept | Terme à utiliser | Terme à éviter |
|---------|-----------------|----------------|
| Utilisateur particulier | **usager** | client, utilisateur (sauf dans les noms de variables techniques) |
| Vendeur de gaz | **vendeur** | professionnel, commerçant (sauf contexte métier spécifique) |
| Compte usager | **compte usager** | compte client |
| S'identifier | **Se connecter** | Connexion, Se logger, Login |
| Créer un compte | **Créer un compte** | S'inscrire, S'enregistrer |
| Enregistrer | **Enregistrer** | Sauvegarder, Valider |
| Modifier | **Modifier** | Editer, Changer |
| Supprimer | **Supprimer** | Effacer, Retirer |
| Annuler | **Annuler** | Abandonner |
| Disponibilité | **Disponibilité** | Stock, État (sauf contexte technique) |
| Point de vente | **Point de vente** | Dépôt, Commerce, Magasin |
| Bouteille de gaz | **Bouteille de gaz** | Bouteille, Cylindre (sauf contexte technique) |
| Réservation | **Réservation** | Commande, Achat (sauf contexte transactionnel) |
| Gaz domestique | **gaz domestique** | gaz de cuisson, butane, propane (sauf précision technique) |

## 5. Règles de rédaction des boutons

- Verbe à l'impératif ou à l'infinitif, jamais au nom
- Courts (3 mots maximum idéalement)
- Exemples : `Se connecter`, `Créer un compte`, `Envoyer`, `Modifier`, `Supprimer`, `Annuler`, `Rechercher du gaz`
- Pas de points de fin sur les boutons

## 6. Règles de rédaction des notifications et messages système

### Messages de succès
- Positifs, concis, confirmant l'action
- Exemples : `Message envoyé avec succès.`, `Compte créé avec succès.`, `Email vérifié.`

### Messages d'erreur
- Clarifient le problème et indiquent la suite
- Pas de jargon technique exposé à l'utilisateur
- Exemples : `Identifiants incorrects.`, `Le code a expiré. Veuillez en demander un nouveau.`, `Une erreur inattendue est survenue. Veuillez réessayer.`

### Messages de confirmation avant suppression
- Indiquent clairement ce qui sera supprimé
- Proposent deux actions claires : confirmer / annuler

### Messages de chargement
- `Chargement…`, `Envoi en cours…`, `Vérification en cours…`

### États vides
- `Aucun résultat trouvé.` (recherche)
- Texte explicatif + bouton d'action quand pertinent

## 7. Règles d'affichage des nombres, unités et symboles

- **Devise** : `FCFA` (espace insécurisée entre le nombre et l'unité) — ex: `5 000 FCFA`
- **Pourcentage** : `%` collé au nombre — ex: `100%`
- **Téléphone** : format international avec `+237`, espaces par groupes de 2 — ex: `+237 690 12 34 56`
- **Email** : tout en minuscules, pas d'accent
- **Date** : format français `JJ/MM/AAAA` ou `JJ mois AAAA`
- **Heure** : format 24h — ex: `14:30`

## 8. Règles de rédaction des titres et descriptions

### Titres (H1, H2, H3)
- Un seul H1 par page
- Hiérarchie respectée : H1 > H2 > H3
- Titres courts, informatifs, sans point de fin
- Première lettre en majuscule, reste en minuscule (sauf noms propres)

### Descriptions et meta
- Descriptions uniques par page
- Longueur recommandée : 150-160 caractères pour les meta descriptions
- Mots-clés naturels, pas de bourrage

## 9. Règles de cohérence entre les interfaces

- Même bouton = même libellé partout (`Se connecter` et non `Connexion` d'un côté et `Se connecter` de l'autre)
- Même icône = même fonction partout (ex: `Search` pour la recherche, `User` pour le compte, `Sun` pour le thème)
- Même terminologie dans les dashboards client, vendeur et administrateur
- Les dashboards respectent la même charte que le site public

## 10. Règle obligatoire pour les futurs développements

> **Aucun nouveau dashboard, module, composant, formulaire ou fonctionnalité ne doit être développé sans respecter cette charte éditoriale.**

Cette règle s'applique à tous les développeurs, agents IA et contributeurs du projet GazPoints. Toute nouvelle interface doit utiliser :
- La terminologie officielle du tableau ci-dessus
- Le vouvoiement systématique
- La ponctuation française
- Les libellés de boutons standardisés

## 11. Vérification obligatoire avant tout build

1. Vérifier l'absence de fautes d'accent (`é`, `è`, `à`, `ù`, `ç`)
2. Vérifier l'absence de `&apos;` ou entités HTML obsolètes
3. Vérifier la cohérence du tutoiement/vouvoiement (systématiquement "vous")
4. Vérifier l'unicité des titres et descriptions SEO
5. Vérifier l'absence de répétitions inutiles
6. Exécuter `pnpm build` et corriger toutes les erreurs
