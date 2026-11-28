# 0005. Gestion des réservations et de l’historique vendeur

**Date**: 2026-11-28
**Status**: Proposed

## Summary

La rubrique « Mes réservations » devient le centre de travail du vendeur pour chaque demande reçue depuis les pages publiques. Le vendeur peut consulter, vérifier, modifier, faire avancer, terminer, annuler et, dans les cas autorisés, supprimer une réservation qui lui appartient. La rubrique « Historique » rassemble les réservations, les notifications et les activités du vendeur, avec une suppression groupée sûre des notifications.

Le travail réutilise les tables Neon, les routes et les composants existants. Seules trois colonnes facultatives ou sans impact sur les lignes anciennes sont ajoutées à `reservation` pour conserver la consigne du client, la note du vendeur et les services demandés. Les codes et l’historique existants sont conservés.

## Requirements

**User stories**:

- En tant que vendeur, je veux voir toutes les réservations de mes points de vente dans un seul centre de gestion afin de ne rien laisser sans réponse.
- En tant que vendeur, je veux comprendre qui demande quoi, pour quel point et avec quelles consignes afin de préparer la prise en charge.
- En tant que vendeur, je veux vérifier un code et suivre les règles de traitement afin d’éviter les erreurs et les doubles retraits.
- En tant que vendeur, je veux conserver les réservations terminées afin de garder une trace fiable de mon activité.
- En tant que vendeur, je veux consulter mes notifications et activités, puis supprimer seulement les notifications choisies, sans toucher aux données métier.

**Acceptance criteria** (the contract, each criterion is independently checkable):

- **AC-1**: « Mes réservations » liste toutes les réservations du vendeur connecté, quel que soit le nombre de points de vente. Aucune réservation d’un autre vendeur n’apparaît.
- **AC-2**: Chaque ligne affiche le code, le nom et le téléphone disponibles du client, le point de vente, la disponibilité ou le service sollicité, la marque, le format, la quantité, la date de la demande, la consigne client, la note vendeur et le statut.
- **AC-3**: La page affiche des cartes statistiques calculées depuis les réservations du vendeur, avec au minimum le total, les demandes en attente, les confirmations et les réservations terminées.
- **AC-4**: Le vendeur peut filtrer la liste par statut et par point de vente. Il peut aussi rechercher par code, client, marque, format ou point. Un lien contenant `search` ouvre la liste sur la réservation demandée.
- **AC-5**: Le vendeur peut ouvrir un panneau de détail qui affiche toutes les informations de la réservation et la disponibilité associée.
- **AC-6**: Le vendeur peut vérifier une réservation par son code. Les codes historiques de 10 caractères et les codes actuels de 12 caractères sont acceptés. Un code appartenant à un autre vendeur est refusé.
- **AC-7**: Le vendeur peut modifier la quantité et sa note vendeur tant que la réservation est en attente ou confirmée, avant son expiration. Le point de vente, la disponibilité, la marque, le format et le code ne sont pas modifiables.
- **AC-8**: Le cycle est strict. `en_attente` peut devenir `confirmed` ou `cancelled`. `confirmed` peut devenir `collected`, `terminee` ou `cancelled`. Les états terminaux ne reviennent pas en arrière. Une transition invalide est refusée par le serveur.
- **AC-9**: Une réservation issue d’une disponibilité `disponible` est créée avec le statut `confirmed`. Une réservation issue d’une disponibilité `a_confirmer` est créée avec le statut `en_attente`.
- **AC-10**: Une annulation, une modification de quantité, une finalisation et une suppression demandent une confirmation visible avant l’appel serveur.
- **AC-11**: Le vendeur ne peut supprimer que sa propre réservation annulée. Une réservation récupérée, terminée, expirée ou encore active est conservée.
- **AC-12**: Une modification de quantité ajuste le stock réservé une seule fois. Une annulation libère le stock réservé une seule fois. Une collecte ou une finalisation décompte le stock physique et le stock réservé une seule fois.
- **AC-13**: Chaque changement est enregistré dans Neon puis répercuté immédiatement dans la liste, le panneau de détail, les statistiques et les autres interfaces concernées. Le client reçoit une notification lors d’un changement de statut important.
- **AC-14**: Les services choisis par le client et sa consigne sont enregistrés avec la réservation. La consigne client reste en lecture seule. La note vendeur est séparée et modifiable.
- **AC-15**: Une demande faite sur une disponibilité appartenant à un point précis est enregistrée avec le bon vendeur, le bon point et la bonne disponibilité. Les valeurs de vendeur, point, marque et format envoyées par le navigateur ne sont jamais acceptées comme preuve.
- **AC-16**: Les réservations concernant plusieurs points de vente du même vendeur restent distinctes et toutes visibles. Une réservation ne représente qu’un point et une disponibilité.
- **AC-17**: Le vendeur peut consulter ses notifications et ses activités depuis l’historique. Il peut supprimer une notification individuellement, sélectionner plusieurs notifications, tout sélectionner, tout désélectionner, puis supprimer la sélection.
- **AC-18**: Une suppression groupée demande confirmation et supprime uniquement les notifications sélectionnées qui appartiennent au vendeur connecté. Aucune réservation, aucun point de vente, aucune disponibilité et aucune autre donnée métier n’est supprimée.
- **AC-19**: Après une suppression individuelle ou groupée, la liste des notifications, les compteurs et l’historique sont actualisés immédiatement.
- **AC-20**: Les actions ont des libellés accessibles, les contrôles ont un nom accessible et l’interface reste compacte et utilisable sur mobile, tablette et ordinateur.
- **AC-21**: Aucune ligne de réservation existante, aucun code existant et aucun historique terminé ne sont transformés lors de la migration. Les anciennes notifications restent accessibles.
- **AC-22**: Le typecheck, les tests ciblés et le build Next.js réussissent. Les contrôles couvrent la création publique, l’apparition vendeur, les détails, la modification, les transitions, la finalisation, la suppression autorisée, la suppression d’une notification, la sélection multiple, la suppression groupée et l’isolation entre vendeurs.

## Decision

**Chosen option**: Option 1, étendre le système existant par des tranches de bout en bout.

Les routes, la table `reservation`, la table `notification` et les composants vendeur existants restent en place. Les contrôles de cycle, les détails, la modification, la suppression autorisée, les filtres et la présentation sont renforcés dans leur zone actuelle. Les pages publiques transmettent les services et la consigne, puis le serveur les rattache à la disponibilité réellement sélectionnée.

## Feature design

**Data model sketch**:

Aucune nouvelle table n’est créée. La migration ajoute uniquement des colonnes sûres à `reservation`.

| Entité | Champs utilisés ou ajoutés | Nullabilité et règles |
|---|---|---|
| `reservation` | `id`, `user_id`, `vendor_id`, `point_id`, `disponibilite_id`, `reservation_code` | Existants. Le code reste unique et immuable. Le vendeur et le point sont dérivés côté serveur. |
| `reservation` | `client_name`, `client_phone` | Existants. Ce sont les informations client disponibles au moment de la demande. |
| `reservation` | `client_note` | `text` facultatif, 1 000 caractères maximum. Écrit par le client, jamais écrasé par le vendeur. |
| `reservation` | `vendor_note` | `text` facultatif, 1 000 caractères maximum. Écrit et modifié par le vendeur propriétaire. |
| `reservation` | `requested_services` | `text[]` avec tableau vide par défaut. Valeurs limitées à `delivery`, `exchange` et `gas_sale`. |
| `reservation` | `brand`, `format`, `quantity`, `amount`, `amount_type` | Existants. Marque et format sont repris de la disponibilité. La quantité reste entre 1 et 20. |
| `reservation` | `status`, `reserved_at`, `collected_at`, `cancelled_at`, `expires_at`, `created_at`, `updated_at` | Existants. Les états `collected`, `terminee`, `cancelled` et `expired` sont terminaux. |
| `point_de_vente` | `id`, `vendor_id`, `name`, `district`, `address`, `phone` | Existants. Aucun changement. |
| `disponibilite` | `id`, `point_id`, `vendor_id`, `status`, `quantity`, `reserved_quantity`, `brand`, `format`, `expires_at`, services | Existants. Aucun changement. |
| `notification` | `id`, `user_id`, `type`, `title`, `message`, `read`, `archived`, dates | Existants. La suppression porte seulement sur cette table. |

**Relations**:

- Une réservation appartient à un client (`user_id`), un vendeur (`vendor_id`), un point de vente (`point_id`) et au plus une disponibilité (`disponibilite_id`).
- Un vendeur possède plusieurs points de vente. Chaque point peut avoir plusieurs disponibilités.
- Une notification appartient à un seul utilisateur. Elle ne possède aucune relation de suppression avec une réservation.

**State transitions**:

```text
disponibilite disponible  -> reservation confirmed
disponibilite a_confirmer -> reservation en_attente

en_attente -> confirmed
en_attente -> cancelled
confirmed  -> collected
confirmed  -> terminee
confirmed  -> cancelled

collected, terminee, cancelled, expired -> aucun état suivant
```

Les transitions sont contrôlées par une règle serveur unique. Une expiration transforme l’état effectif en `expired` sans effacer l’historique.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/reservation/create` | POST | `disponibiliteId`, `quantity`, `clientNote`, `requestedServices` | Code, statut initial, point, marque, format, quantité, montant | Session client | 400, 401, 404, 409 |
| `/api/reservation/vendor` | GET | `status`, `pointId`, `search`, `page`, `pageSize` | Réservations filtrées, points du vendeur, statistiques, pagination | Session vendeur et propriété | 401, 403 |
| `/api/reservation/vendor/[id]` | GET | Identifiant | Détail complet et disponibilité liée | Session vendeur et propriété | 401, 403, 404 |
| `/api/reservation/vendor/[id]` | PATCH | `quantity`, `vendorNote` | Réservation mise à jour et stock ajusté | Session vendeur et propriété | 400, 401, 403, 404, 409 |
| `/api/reservation/vendor/[id]` | DELETE | Identifiant | Réservation annulée supprimée | Session vendeur et propriété | 401, 403, 404, 409 |
| `/api/reservation/vendor` | POST | `reservationId`, `action` | Nouvelle transition et effets sur le stock | Session vendeur et propriété | 400, 401, 403, 404, 409 |
| `/api/reservation/verify` | POST | Code de 10 ou 12 caractères | Réservation effective et expiration | Session vendeur et propriété | 400, 401, 403, 404 |
| `/api/reservation/collect` | POST | Code de 10 ou 12 caractères | Retrait confirmé et stock décrémenté | Session vendeur et propriété | 400, 401, 403, 404, 409 |
| `/api/notifications` | GET | Filtres, page | Notifications du compte et compteurs | Session et propriété | 401 |
| `/api/notifications/[id]` | DELETE | Identifiant | Notification supprimée | Session et propriété | 401, 404 |
| `/api/notifications/bulk` | POST | `action=delete`, `ids` | Nombre de notifications supprimées | Session et propriété | 400, 401 |

**Value sourcing**:

| Action | Value produced / displayed | Source |
|---|---|---|
| Création publique | Vendeur | `point_de_vente.vendor_id` de la disponibilité sélectionnée |
| Création publique | Point de vente | `disponibilite.point_id` |
| Création publique | Disponibilité | `disponibilite.id` validé par le serveur |
| Création publique | Marque et format | Colonnes `brand` et `format` de la disponibilité |
| Création publique | Statut initial | `disponibilite.status`, selon la règle de la section State transitions |
| Création publique | Consigne client | Entrée `clientNote`, nettoyée et limitée à 1 000 caractères |
| Création publique | Services demandés | Entrée `requestedServices`, filtrée sur la liste blanche |
| Liste vendeur | Réservations | Table `reservation` filtrée par `vendor_id` de la session et `point_id` appartenant au vendeur |
| Liste vendeur | Points des filtres | Table `point_de_vente` filtrée par `vendor_id` de la session |
| Liste vendeur | Statistiques | Agrégats des mêmes réservations filtrées |
| Détail vendeur | Client | Colonnes `client_name` et `client_phone` |
| Détail vendeur | Service et disponibilité | Jointure `disponibilite`, complétée par `requested_services` |
| Détail vendeur | Consignes et note | Colonnes `client_note` et `vendor_note` |
| Détail vendeur | Statut effectif | `reservation.status`, puis `expired` si `confirmed` et `expires_at` est passé |
| Modification | Montant | `calculateReservationAmount(quantity)` |
| Modification | Stock | `disponibilite.quantity` et `disponibilite.reserved_quantity`, mis à jour par condition SQL |
| Annulation | Date d’annulation | `reservation.cancelled_at`, écrite au moment de la transition |
| Collecte ou finalisation | Date de retrait | `reservation.collected_at`, écrite au moment de la transition |
| Historique | Réservations | `/api/reservation/vendor` |
| Historique | Activités de disponibilités | `/api/disponibilite/mine` |
| Historique | Notifications | `/api/notifications` filtré sur la session |
| Suppression de notification | Notification supprimée | `notification.id` et `notification.user_id` de la session |
| Suppression groupée | Notifications supprimées | `notification.id` dans la sélection et `notification.user_id` de la session |

**Key invariants**:

- Le rôle et l’identifiant vendeur viennent toujours de la session serveur.
- Une réservation accessible par un vendeur doit correspondre à la fois à son `vendor_id` et à un point de vente qu’il possède.
- Le code de réservation est unique, immutable et accepte les longueurs historiques 10 et 12.
- La marque et le format d’une réservation sont ceux de la disponibilité au moment de la création.
- La quantité reste un entier entre 1 et 20.
- Le stock réservé ne peut jamais être libéré ou décrémenté deux fois pour la même transition.
- Une réservation récupérée, terminée, expirée ou active ne peut pas être supprimée.
- Une notification supprimée ne supprime jamais une réservation ou une autre donnée métier.
- Les lignes existantes restent lisibles avant et après la migration.

**Security model**:

Les pages vendeur relisent la session avec `requireVendor`. Chaque route vendeur relit la session avec `getProUser`, vérifie `role === "vendor"`, puis applique la propriété dans la requête SQL. La propriété est contrôlée par `reservation.vendor_id` et par l’appartenance du `point_id` au vendeur.

Les routes de notification utilisent `session.user.id` dans toutes les lectures, mises à jour et suppressions. La suppression groupée utilise `inArray` avec la même condition de propriété. Les erreurs ne révèlent pas si une donnée appartient à un autre compte.

Les informations client restent limitées au nom et au téléphone déjà enregistrés. Aucun nouveau secret, paiement ou donnée de santé n’est traité.

**Configuration required**:

Aucune nouvelle variable d’environnement, dépendance ou secret n’est nécessaire.

**Critical test scenarios** (each maps to an acceptance criterion in `## Requirements`):

- Parcours nominal : une réservation publique sur une disponibilité `a_confirmer` crée une ligne `en_attente`, puis le vendeur la voit dans « Mes réservations », ouvre son détail, ajoute une note, confirme, puis termine la réservation, verifies **AC-1**, **AC-2**, **AC-5**, **AC-7**, **AC-8**, **AC-9**, **AC-13**, **AC-14**.
- Réservations multiples : deux demandes sur deux points du même vendeur restent deux lignes distinctes et les filtres par point les séparent, verifies **AC-4**, **AC-15**, **AC-16**.
- Vérification : un code actuel de 12 caractères et un code historique de 10 caractères sont acceptés, un code d’un autre vendeur est refusé, verifies **AC-6**.
- Modification : une augmentation de quantité réussit si le stock le permet, un stock insuffisant est refusé, une réservation terminée ne peut plus être modifiée, verifies **AC-7**, **AC-12**.
- Cycle : une réservation confirmée peut être annulée, récupérée ou terminée. Une réservation terminée ne peut pas revenir en attente. Une suppression échoue sauf pour une réservation annulée, verifies **AC-8**, **AC-11**, **AC-12**.
- Confirmation : annuler, modifier la quantité, terminer et supprimer demandent une confirmation, verifies **AC-10**.
- Notifications : une notification propre est supprimée, une notification d’un autre compte ne l’est pas, verifies **AC-17**, **AC-18**.
- Sélection groupée : tout sélectionner, tout désélectionner et supprimer la sélection ne touchent que les identifiants choisis. La réservation liée reste présente, verifies **AC-18**, **AC-19**.
- Mobile : la liste, les filtres, le détail et les actions restent utilisables sur un écran mobile, verifies **AC-20**.
- Migration et livraison : les anciennes lignes et les codes existants restent présents, le typecheck, les tests et le build réussissent, verifies **AC-21**, **AC-22**.

## Build plan

Le projet utilise l’approche Tracer Bullet. Chaque tranche relie la donnée, la règle serveur, l’interface et le test avant de passer à la suivante.

1. Ajouter la migration additive pour `client_note`, `vendor_note` et `requested_services`, avec valeurs par défaut sûres pour les lignes anciennes, puis vérifier que les réservations existantes et leurs codes restent lisibles, satisfies **AC-14**, **AC-21**.
2. Extraire une règle serveur unique pour le cycle des réservations, les transitions autorisées, les actions possibles et le statut effectif expiré, puis la tester sans interface, satisfies **AC-8**, **AC-9**, **AC-11**.
3. Étendre `/api/reservation/create` pour valider et conserver la consigne et les services, choisir le statut initial selon la disponibilité et rejeter toute valeur d’identité envoyée par le navigateur, satisfies **AC-9**, **AC-14**, **AC-15**, **AC-16**.
4. Durcir `/api/reservation/vendor` pour la propriété, les filtres, la recherche, la pagination, les points du vendeur et les statistiques, puis aligner la lecture serveur de la page sur cette source, satisfies **AC-1**, **AC-3**, **AC-4**, **AC-15**, **AC-16**.
5. Ajouter `/api/reservation/vendor/[id]` pour le détail, la modification et la suppression autorisée. Ajuster le stock avec des mises à jour conditionnelles et invalider les caches vendeur, satisfies **AC-5**, **AC-7**, **AC-10**, **AC-11**, **AC-12**, **AC-13**.
6. Durcir les actions vendeur existantes pour les transitions strictes, la libération du stock à l’annulation et la consommation du stock à la collecte ou à la finalisation. Ajouter la notification client et le rafraîchissement des interfaces, satisfies **AC-8**, **AC-12**, **AC-13**.
7. Refondre « Mes réservations » avec cartes statistiques, filtres, recherche, badges, liste compacte, actions accessibles et panneau de détail. Utiliser les composants vendeur existants et une présentation mobile en cartes, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-20**.
8. Ajouter les confirmations visibles pour les actions sensibles et le support des codes de 10 et 12 caractères dans le formulaire de vérification, satisfies **AC-6**, **AC-10**, **AC-20**.
9. Enrichir l’historique vendeur avec les onglets Réservations, Notifications et Activités. Réutiliser le centre de notifications, ajouter la sélection multiple déjà présente et vérifier qu’il ne propose aucune suppression de donnée métier, satisfies **AC-17**, **AC-18**, **AC-19**, **AC-20**.
10. Ajouter les tests ciblés du flux public, du dashboard vendeur, du cycle, des stocks, des notifications, de la sélection groupée et de l’isolation entre vendeurs, puis exécuter le typecheck, la suite complète et le build, satisfies **AC-22**.
11. Examiner le diff complet, préserver les modifications non liées déjà présentes, créer un commit propre, pousser la branche après réussite, puis vérifier le déploiement Vercel, satisfies **AC-21**, **AC-22**.

## Consequences

**Positive**:

- Le vendeur dispose d’un véritable centre de gestion, pas seulement d’un tableau de lecture.
- Les règles de statut, de stock et de propriété sont explicites et appliquées côté serveur.
- Les demandes publiques gardent leur contexte complet, y compris la consigne et les services demandés.
- Les notifications peuvent être nettoyées sans risque pour les réservations.
- L’historique devient un point unique de consultation et de nettoyage.

**Negative / tradeoffs**:

- Une migration additive est nécessaire pour conserver le contexte de la demande.
- Le cycle strict refuse certaines actions qui étaient acceptées sans contrôle de l’état précédent.
- Les écrans vendeur gagnent des états, des confirmations et des contrôles de concurrence à maintenir.
- La gestion des stocks reste sans transaction multi requête. Les mises à jour conditionnelles réduisent le risque, mais une compensation est encore nécessaire en cas d’échec tardif.

**Neutral**:

- Les tables `notification`, `point_de_vente` et `disponibilite` ne changent pas.
- Les codes de réservation existants ne changent pas.
- Aucun nouveau service commercial n’est créé. La liste des services enregistrés reste limitée aux services déjà proposés.
- Les dashboards client et admin gardent leurs routes et leurs données.

## Follow-up

- [ ] La branche courante est 110 commits derrière `origin/main` et contient des modifications non liées. Avant une fusion future, mettre ces travaux en sécurité puis réconcilier `origin/main` dans une étape séparée.
- [ ] Après vérification en navigateur avec une session vendeur réelle, contrôler les formats mobile, tablette et ordinateur ainsi que les thèmes clair et sombre.
- [ ] Après le build et la réussite des tests, vérifier le déploiement Vercel et la présence des nouvelles colonnes dans Neon.

## Rationale

Reasoning and options: see [rationale.md](rationale.md).
