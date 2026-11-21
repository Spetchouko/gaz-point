# 0004. Reconstruction du dashboard vendeur GazPoints

**Date**: 2026-11-21
**Status**: Accepted

## Summary

Tu remplaces l'interface vendeur actuelle par une nouvelle expérience complète. Une seule coquille de navigation, partagée avec le dashboard client et paramétrée par rôle, garde le même comportement sur ordinateur, tablette et mobile tout en conservant les menus vendeur. Les sept rubriques demandées s'appuient sur les tables et les routes serveur existantes, complétées seulement par les routes vendeur qui manquent. Les comptes, points de vente, disponibilités, réservations, paiements et notifications restent intacts, sans migration de schéma.

## Requirements

**User stories**

- En tant que vendeur, je veux une interface claire et compacte pour gérer mon activité sans chercher dans plusieurs anciens menus.
- En tant que vendeur, je veux retrouver exactement le même comportement de navigation que dans le dashboard client, avec mes propres rubriques.
- En tant que vendeur, je veux gérer mon dépôt, mes disponibilités, mes réservations, mes services, mon avis et mon profil depuis sept rubriques distinctes.
- En tant que vendeur, je veux voir uniquement mes données et recevoir un retour visible après chaque action.
- En tant qu'administrateur ou client, je veux que mes propres dashboards restent inchangés.

**Acceptance criteria** (the contract, each criterion is independently checkable)

- **AC-1**: Sur chaque page vendeur, une seule coquille de dashboard est rendue. Il n'y a qu'un seul `ThemeProvider`, un seul menu latéral, un seul header et un seul footer.
- **AC-2**: La sidebar, le header, le bouton d'ouverture du menu, le repli sur ordinateur, le tiroir mobile, les transitions, les états actifs, la gestion du défilement et le menu de thème ont le même comportement que dans le dashboard client, sur ordinateur, tablette et mobile.
- **AC-3**: La navigation vendeur contient exactement sept rubriques dans cet ordre : Vue d'ensemble, Mes points de vente, Mes disponibilités, Mes réservations, Mes services, Donner mon avis, Mon profil. Aucun lien client ne remplace un lien vendeur.
- **AC-4**: Chaque page et chaque action vérifie le rôle vendeur côté serveur, puis filtre les données sur l'identité du vendeur connecté. Aucun rôle, aucun identifiant de vendeur et aucun identifiant de dépôt fourni par le navigateur n'est accepté comme preuve d'accès.
- **AC-5**: La vue d'ensemble affiche le nombre de points de vente, le nombre de disponibilités actives, le nombre de réservations reçues et les dernières activités. Ces valeurs viennent uniquement des tables existantes, sans donnée fictive et sans filtre de date.
- **AC-6**: Quand un vendeur n'a encore aucune donnée, la vue d'ensemble affiche une carte d'accueil avec des actions réelles vers la création d'un point de vente et d'une disponibilité.
- **AC-7**: La rubrique Mes points de vente permet de créer un dépôt, puis de modifier ses informations, sa localisation, ses marques et ses formats. Le vendeur ne peut voir et modifier que son propre dépôt, et la règle actuelle d'un seul dépôt par vendeur reste en vigueur.
- **AC-8**: La rubrique Mes disponibilités permet d'ajouter une disponibilité, de modifier une disponibilité existante, de l'activer ou de la désactiver, de consulter les disponibilités publiées et de voir le dépôt associé. Toute modification concerne uniquement les disponibilités du vendeur connecté.
- **AC-9**: La rubrique Mes réservations permet de consulter les réservations reçues, de voir les codes, les informations de traitement et les actions de statut déjà prévues par l'API. Un vendeur ne peut pas consulter ni modifier la réservation d'un autre vendeur.
- **AC-10**: La rubrique Mes services permet de gérer la livraison et le coursier à travers les champs de livraison existants, les frais de livraison, l'échange, la vente de gaz et les informations de contact du dépôt. Aucun champ coursier distinct n'est ajouté.
- **AC-11**: La rubrique Donner mon avis permet au vendeur de soumettre un avis, de le modifier quand son statut le permet et de voir son statut de validation. Un seul avis par auteur reste la règle en vigueur.
- **AC-12**: La rubrique Mon profil affiche les informations personnelles, les informations professionnelles disponibles, les coordonnées et les paramètres du compte à partir des routes utilisateur existantes.
- **AC-13**: Chaque page interactive affiche un état de chargement, un état vide propre, un message d'erreur avec nouvelle tentative et un toast après une action réussie.
- **AC-14**: Les anciens layouts, widgets, menus et composants visuels vendeur devenus inutiles sont supprimés. Aucun compte, point de vente, disponibilité, réservation, abonnement, notification ni table Neon n'est supprimé ou réinitialisé.
- **AC-15**: Les dashboards client et administrateur gardent leurs routes, leurs menus, leurs données et leur comportement. Aucune régression visuelle ou fonctionnelle n'est observée sur ces deux espaces.
- **AC-16**: Les trois formats sont vérifiés : ordinateur, tablette et mobile. Le contraste et la lisibilité sont vérifiés en mode clair et en mode sombre.
- **AC-17**: Les failles connues sont corrigées avant la fin : modification inter vendeurs via `POST /api/reservation/vendor`, fuite inter vendeurs via `GET /api/disponibilite/[id]`, longueur de code de collecte incohérente, et routes de réservation vendeur classées comme partagées dans la navigation serveur.
- **AC-18**: `pnpm build` se termine avec succès. Les vérifications ciblées disponibles sont exécutées et les erreurs liées à ce changement sont corrigées.
- **AC-19**: Aucune variable d'environnement n'est modifiée, aucune dépendance n'est installée sans nécessité et aucune migration de schéma n'est créée.
- **AC-20**: La publication directe du vendeur après vérification de son compte reste inchangée, sans approbation administrative obligatoire.

## Decision

**Chosen option**: Option 2, remplacement progressif avec strangler.

Je construis la nouvelle interface à côté de l'ancienne, je bascule une tranche complète à la fois, puis je retire seulement les anciens fichiers devenus sans import. Les routes serveur manquantes sont ajoutées sans toucher au schéma. Les clients, administrateurs et collaborateurs gardent leurs espaces actuels.

## Feature design

**Data model sketch**

Aucune migration n'est prévue. Le modèle cible est le schéma actuel de `db/schema.ts`.

- `user` : `id`, `name`, `email`, `phoneNumber`, `image`, `role`, `isActive`, `emailVerified`, `lastLoginAt`, `createdAt`.
- `point_de_vente` : `id`, `vendorId`, `name`, `district`, `address`, `phone`, `brands`, `formats`, `latitude`, `longitude`, `deliveryEnabled`, `deliveryFee`, `exchangeEnabled`, `exchangeBrands`, `exchangeFormats`, `gasSaleEnabled`, `isActive`, `createdAt`, `updatedAt`. Un seul dépôt par vendeur.
- `disponibilite` : `id`, `pointId`, `vendorId`, `status`, `quantity`, `reservedQuantity`, `price`, `brand`, `format`, `weightKg`, `expiresAt`, `phone`, `note`, `source`, `delivery`, `exchange`, `gasSale`, `createdAt`, `updatedAt`.
- `reservation` : `id`, `userId`, `vendorId`, `pointId`, `disponibiliteId`, `code`, `status`, `quantity`, et les informations de contact et de suivi déjà présentes.
- `avis` : `id`, `userId`, `authorName`, `authorRole`, `city`, `quote`, `rating`, `status`. Un seul avis par auteur.
- `vendor_onboarding`, `vendor_subscription`, `payment_transaction`, `notification`, `user_preference` : conservés tels quels et utilisés en lecture ou écriture par les routes existantes.

**State transitions**

- Disponibilité : `indisponible` vers `disponible` et retour par la route de statut existante. Une disponibilité reste effective seulement si `expiresAt` est absent ou dans le futur.
- Réservation : `pending` vers `confirmed` puis `collected` ou `terminee`, et `pending` vers `cancelled`. Seules les transitions déjà exposées par l'API vendeur sont affichées.
- Avis : `pending` vers `approved` ou `rejected` par l'administration. Modifier un avis le repasse en `pending`.
- Abonnement vendeur : lu depuis `vendor_subscription`, sans changement de logique de paiement.

**API surface**

| Route | Méthode | Entrées clés | Sorties clés | Autorisation | Erreurs clés |
|---|---|---|---|---|---|
| `/api/depot/mine` | GET | aucune | dépôt du vendeur | session vendeur | 401, 403, 404 |
| `/api/depot/create` | POST | nom, district, adresse, téléphone, marques, formats | dépôt créé | session vendeur | 400, 409, 403 |
| `/api/depot/[id]` | PATCH | nom, district, adresse, téléphone, latitude, longitude, marques, formats, services | dépôt mis à jour | session vendeur et propriété | 400, 403, 404 |
| `/api/depot/[id]/services` | PATCH | trois bascules existantes | dépôt mis à jour | session vendeur et propriété | 400, 403, 404 |
| `/api/vendor/onboarding` | GET | aucune | onboarding du vendeur | session vendeur | 401, 403 |
| `/api/disponibilite/mine` | GET | aucune | disponibilités du vendeur | session vendeur | 401, 403 |
| `/api/disponibilite/mine` | POST | pointId, marque, format, quantité, statut, prix, note, téléphone | disponibilité créée ou mise à jour | session vendeur et propriété du point | 400, 403, 404 |
| `/api/disponibilite/[id]` | PATCH | quantité, prix, note, marque, format, expiration, téléphone, statut | disponibilité mise à jour | session vendeur et propriété | 400, 403, 404 |
| `/api/disponibilite/[id]/status` | PATCH | statut | disponibilité mise à jour | session vendeur et propriété | 400, 403, 404 |
| `/api/disponibilite/[id]` | GET | identifiant | disponibilité et dépôt | session et propriété ou service public autorisé | 403, 404 |
| `/api/reservation/vendor` | GET | statut, pointId, page, pageSize | réservations et pagination | session vendeur et points du vendeur | 401, 403 |
| `/api/reservation/vendor` | POST | reservationId, action | résultat de l'action | session vendeur et propriété de la réservation | 400, 403, 404 |
| `/api/reservation/verify` | POST | code à 10 caractères | réservation et expiration | session vendeur et propriété | 400, 403, 404 |
| `/api/reservation/scan` | POST | code à 10 caractères | réservation scannable | session vendeur et propriété | 400, 403, 404 |
| `/api/reservation/collect` | POST | code à 10 caractères | collecte confirmée | session vendeur et propriété | 400, 403, 404 |
| `/api/avis` | GET | aucune | avis de l'auteur connecté | session client ou vendeur | 401 |
| `/api/avis` | POST | note, citation | avis en attente | session client ou vendeur | 400, 401, 409 |
| `/api/avis/[id]` | PATCH | note, citation | avis mis à jour en attente | session et propriété | 400, 403, 404 |
| `/api/avis/[id]` | DELETE | identifiant | suppression | session et propriété | 403, 404 |
| `/api/user/me` | GET | aucune | profil connecté | session | 401 |
| `/api/user/profile` | PATCH | nom, téléphone | profil mis à jour | session | 400, 401 |
| `/api/user/avatar` | PATCH | image ou suppression | image mise à jour | session | 400, 401 |
| `/api/user/password` | POST | mot de passe actuel, nouveau mot de passe | mot de passe modifié | session | 400, 401 |
| `/api/user/preferences` | GET, PATCH | préférences | préférences mises à jour | session | 400, 401 |
| `/api/vendor/subscription` | GET | aucune | état de l'abonnement | session vendeur | 401, 403 |
| `/api/notifications` | GET, PATCH | filtres, lecture, archivage | notifications et compteur | session et propriété | 401 |

**Value sourcing**

| Action | Valeur produite ou affichée | Source |
|---|---|---|
| Vue d'ensemble | Nombre de points de vente | `point_de_vente` filtré par `vendorId` égal à l'identifiant de session |
| Vue d'ensemble | Nombre de disponibilités actives | `disponibilite` filtré par `vendorId`, `status` et `expiresAt` |
| Vue d'ensemble | Nombre de réservations reçues | `reservation` filtré par `vendorId` ou par les `pointId` du vendeur |
| Vue d'ensemble | Dernières activités | Fusion triée des `createdAt` et `updatedAt` de `reservation` et `disponibilite` du vendeur, limitée aux cinq plus récentes |
| Création de dépôt | Nom, district, adresse, téléphone, marques, formats | Champs validés du formulaire, catalogue existant de `brand` et de formats |
| Modification de dépôt | Latitude et longitude | Champs du formulaire validés comme coordonnées numériques dans les colonnes existantes |
| Modification de dépôt | Frais de livraison et listes d'échange | Entrées validées écrites dans `deliveryFee`, `exchangeBrands` et `exchangeFormats` |
| Disponibilités | Statut affiché | `disponibilite.status` combiné à `expiresAt` |
| Disponibilités | Dépôt associé | `disponibilite.pointId` joint à `point_de_vente.id` du vendeur |
| Réservations | Code affiché | `reservation.code`, formaté par l'utilitaire existant |
| Réservations | Statut et actions possibles | `reservation.status` et transitions autorisées par la route serveur |
| Services | Interrupteurs et frais | `deliveryEnabled`, `exchangeEnabled`, `gasSaleEnabled`, `deliveryFee`, `exchangeBrands`, `exchangeFormats` |
| Services | Contact du dépôt | `point_de_vente.name`, `phone`, `address`, `district` |
| Avis | Statut de validation | `avis.status` filtré par `userId` de l'auteur connecté |
| Profil | Informations personnelles et professionnelles | `user.name`, `email`, `phoneNumber`, `image`, `role`, `lastLoginAt`, `createdAt` |
| Coquille | Compteur de notifications | Route `/api/notifications`, déjà filtrée par utilisateur |
| Coquille | Mode clair et sombre | Jetons existants de `app/globals.css` et préférence de thème déjà gérée par le projet |

**Key invariants**

- Un vendeur possède au plus un dépôt.
- Toute lecture ou écriture vendeur est filtrée par l'identifiant du vendeur issu de la session relue côté serveur.
- Aucun identifiant de dépôt, de disponibilité ou de réservation venant du navigateur ne suffit à autoriser une action.
- Aucune statistique ne contient de valeur inventée.
- La navigation vendeur garde les sept rubriques dans l'ordre prévu.
- Un seul shell, un seul `ThemeProvider`, un seul header et un seul footer sont rendus par page dashboard.
- Les codes de réservation générés et validés ont une longueur de 10 caractères.
- Aucune table, aucune colonne, aucune variable d'environnement et aucune dépendance essentielle n'est supprimée.
- La publication vendeur reste directe après vérification du compte.

**Security model**

La session est relue côté serveur avec les helpers existants de `lib/auth-access.ts`, `lib/auth-session.ts` et `lib/session.ts`. Le rôle vient de la base, jamais du navigateur. Chaque page vendeur et chaque route vendeur vérifie `role === "vendor"` puis applique un filtre de propriété sur `vendorId` ou sur les `pointId` appartenant au vendeur.

Les routes `/dashboard/reservations/vendor` et `/dashboard/reservations/verify` sont reclassées comme vendeur dans `lib/auth-routing.ts`. Les autres rôles reçoivent la redirection ou le refus prévu par le mécanisme existant. Les pages client et admin restent protégées par leurs règles actuelles.

Les actions de réservation par identifiant ajoutent une condition de propriété dans la requête de mise à jour. Les routes de lecture d'une disponibilité ajoutent le même contrôle quand l'appelant est vendeur. Les toasts et messages d'erreur ne révèlent jamais l'existence d'une donnée appartenant à un autre vendeur.

**Configuration required**

Aucune nouvelle variable d'environnement n'est nécessaire.

**Critical test scenarios**

- Parcours nominal : connexion vendeur, ouverture des sept rubriques, retour à la vue d'ensemble, vérification des compteurs réels et des dernières activités, vérification **AC-1**, **AC-3**, **AC-5**.
- Parcours de navigation : ouverture et fermeture du tiroir mobile, repli de la sidebar, thème clair et sombre, état actif sur chaque rubrique, vérification **AC-2**, **AC-16**.
- Parcours de données : création puis modification du dépôt, ajout puis modification puis bascule d'une disponibilité, vérification **AC-7**, **AC-8**.
- Parcours de réservation : consultation d'un code, action de statut autorisée, collecte avec un code à 10 caractères, vérification **AC-9**, **AC-17**.
- Cas d'erreur : route vendeur ouverte avec un compte client, tentative de modification d'une réservation d'un autre vendeur, absence de dépôt, échec réseau avec bouton de nouvelle tentative, vérification **AC-4**, **AC-6**, **AC-13**, **AC-17**.
- Non régression : ouverture des dashboards client et admin avant et après la bascule, vérification **AC-15**.
- Validation finale : build production, vérifications ciblées et contrôle que les fichiers supprimés n'ont plus d'import, vérification **AC-14**, **AC-18**, **AC-19**.

## Build plan

Aucune approche de livraison n'est enregistrée dans le projet. Je prends par défaut des tranches fines de bout en bout : chaque tranche rend une rubrique réellement utilisable de la route à la base, puis la suivante. Cela limite le risque d'une reconstruction complète livrée en une seule fois.

1. Figer l'inventaire des imports vendeur et la liste exacte des anciens fichiers à retirer, sans toucher aux API ni aux données, satisfies **AC-14**.
2. Créer `app/_components/dashboard/dashboard-shell.tsx` et la configuration de navigation paramétrée par rôle, puis faire utiliser cette coquille par le dashboard client sans changer son comportement, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-15**.
3. Corriger `app/dashboard/vendeur/layout.tsx` pour vérifier le rôle côté serveur, transmettre la session au shell et retirer le second `ThemeProvider`, satisfies **AC-1**, **AC-4**.
4. Corriger la sécurité des routes existantes : propriété sur `POST /api/reservation/vendor`, propriété sur `GET /api/disponibilite/[id]`, longueur de code de collecte, classification des routes de réservation vendeur, satisfies **AC-4**, **AC-9**, **AC-17**.
5. Ajouter `PATCH /api/depot/[id]` et `PATCH /api/disponibilite/[id]` avec validation et contrôle de propriété, satisfies **AC-7**, **AC-8**.
6. Créer les fonctions serveur de lecture vendeur dans `lib/`, avec filtrage par identifiant de session et calcul des statistiques réelles, satisfies **AC-4**, **AC-5**.
7. Réécrire la vue d'ensemble et ses composants avec carte d'accueil, compteurs et dernières activités, satisfies **AC-5**, **AC-6**, **AC-13**.
8. Réécrire Mes points de vente avec création, modification, localisation, marques et formats, satisfies **AC-7**, **AC-13**.
9. Réécrire Mes disponibilités avec ajout, modification, bascule de statut et association au dépôt, satisfies **AC-8**, **AC-13**.
10. Réécrire Mes réservations et relier les outils de vérification et de collecte existants, satisfies **AC-9**, **AC-13**, **AC-17**.
11. Réécrire Mes services avec livraison et coursier via les champs existants, échange, vente de gaz et contact du dépôt, satisfies **AC-10**, **AC-13**.
12. Réécrire Donner mon avis avec soumission et statut de validation, satisfies **AC-11**, **AC-13**.
13. Réécrire Mon profil avec les routes utilisateur existantes, satisfies **AC-12**, **AC-13**.
14. Retirer les anciens composants vendeur sans import restant et supprimer les doublons de shell, satisfies **AC-1**, **AC-14**.
15. Vérifier les trois formats d'écran, les deux thèmes, les dashboards client et admin, puis exécuter les tests, le lint ciblé, le typecheck ciblé et `pnpm build`, satisfies **AC-15**, **AC-16**, **AC-18**, **AC-19**, **AC-20**.

## Consequences

**Positive**

- Le vendeur dispose d'une interface neuve, compacte et cohérente avec le client.
- La navigation n'est plus dupliquée et le menu vendeur reste distinct.
- Les données et les règles métier existantes sont conservées.
- Les failles connues de propriété sont corrigées avant la mise en service de la nouvelle interface.
- Les états vides, de chargement, d'erreur et de succès deviennent prévisibles sur toutes les rubriques.

**Negative / tradeoffs**

- Deux interfaces vendeur coexistent pendant la migration, ce qui demande une phase de contrôle avant le retrait des anciens fichiers.
- Quelques routes serveur supplémentaires sont nécessaires pour couvrir les actions que l'API actuelle ne permet pas.
- Le service coursier reste porté par la livraison existante, sans identifiant distinct dans la base.
- Le nettoyage du cache de développement doit être fait avec soin pour éviter de reproduire l'erreur Turbopack déjà observée.

**Neutral**

- Le schéma Neon ne change pas.
- Les variables d'environnement ne changent pas.
- Aucune dépendance supplémentaire n'est prévue.

## Migration plan

**Strategy**: strangler

**Phases**

1. Corriger les routes serveur et la sécurité, puis créer le shell partagé sans retirer l'ancien.
2. Remplacer chaque rubrique vendeur par une tranche complète, de la page au composant interactif.
3. Vérifier les trois formats d'écran, les deux thèmes, les trois dashboards et le build.
4. Retirer seulement les anciens fichiers sans import restant, puis relancer une dernière vérification.

**Rollback**: chaque tranche est réversible par retour du commit qui l'a introduite. Aucune donnée n'est transformée, donc aucun retour arrière de base n'est nécessaire.

**Risks**: une mauvaise configuration du shell peut modifier la navigation client, une route serveur oubliée peut laisser une fuite de propriété, et un retrait trop tôt de l'ancien composant peut casser un import indirect.

## Validation (2026-11-21)

- `corepack pnpm build` : réussi avec Next.js 16.3.7 / Turbopack (114 pages générées, aucune erreur de compilation).
- `corepack pnpm test` : réussi (17 scénarios d'auth routing, 68 tests analytics, 66 tests de marques, 14 tests d'avis, ainsi que les suites client, CSV et URL).
- ESLint ciblé sur le shell, les composants vendeur et les routes modifiées : 0 erreur, 0 avertissement.
- TypeScript ciblé après régénération des types Next : aucune erreur dans `.next/types` ni dans les fichiers du périmètre vendeur.
- Contrôle HTTP depuis un serveur de production démarré sur le build frais : routes publiques en 200, routes vendeur et client protégées en 307 vers `/connexion`, route admin vers `/connexion-admin`.
- Non vérifié ici : rendu visuel authentifié sur desktop, tablette et mobile et modes clair/sombre. Aucun navigateur ni session vendeur de test n'est disponible dans cet environnement.

## Follow-up

- [ ] Relancer le serveur de développement avec un cache propre après les modifications, sans arrêter le serveur manuellement pendant une session active.
- [ ] Vérifier visuellement les dashboards client, vendeur et administrateur après la bascule finale, sur trois formats et deux thèmes.
- [x] Enrôler une fonctionnalité dans `docs/scope/` si tu veux suivre le cycle `Proposed`, `In Progress`, `Accepted` de cette spec.
- [ ] Ratifier définitivement cette spec après une vérification réelle des trois formats d'écran.
- [ ] Corriger dans un chantier séparé les défauts préexistants hors périmètre observés dans les coquilles admin et collaborateur, ainsi que le filtrage des avis administratifs.

## Rationale

Reasoning, options and audit inventory: see [rationale.md](rationale.md).
