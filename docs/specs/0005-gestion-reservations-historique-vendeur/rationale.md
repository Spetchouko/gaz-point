# 0005. Gestion des réservations et de l’historique vendeur, raisonnement

## Context

Le dashboard vendeur possède déjà une page « Mes réservations », une API de liste et d’actions, une API de vérification et une API de collecte. La lecture serveur filtre déjà les réservations par vendeur et par point de vente. Les notifications disposent aussi d’une suppression individuelle et d’une suppression groupée qui limitent les lignes au compte connecté.

L’état réel ne respecte pourtant pas le besoin produit. Le composant vendeur impose un code de 10 caractères alors que le générateur actuel en crée 12. Les actions vendeur peuvent changer un statut sans vérifier l’état précédent. Une annulation vendeur ne libère pas le stock réservé. Une finalisation ne décrémente pas le stock physique. La création publique ignore les services choisis et aucune consigne client n’est enregistrée. La page d’historique vendeur ne montre que les réservations. La liste vendeur ne propose ni carte de statistiques, ni filtre par point, ni recherche depuis un lien, ni panneau de détail. Les notifications sont dans une page séparée.

La table `reservation` ne contient aucune consigne client, aucune note vendeur et aucune liste de services demandés. La conservation de ces informations exige donc trois colonnes additives. Les autres informations demandées existent déjà dans `reservation`, `point_de_vente` et `disponibilite`.

Le dépôt contient aussi un travail non lié et non commité sur les points de vente multiples et les disponibilités. La branche est 110 commits derrière `origin/main`. La décision déjà actée dans la spec 0004 reste de continuer sur la branche courante sans fusionner pendant ces travaux.

## Options considered

### Option 1: Étendre le système existant

Réutiliser la table `reservation`, les routes vendeur, le centre de notifications et les composants du dashboard. Ajouter les colonnes de contexte nécessaires, centraliser les transitions, renforcer les contrôles de propriété et enrichir les écrans existants.

**Pros**:
- Le code, les données, les sessions et les règles d’authentification déjà éprouvés restent en place.
- Les dashboards client et admin ne subissent pas une migration de leur parcours.
- Chaque tranche peut être testée et livrée séparément.
- Les codes et l’historique existants restent stables.

**Cons**:
- Les règles sont réparties entre plusieurs routes et doivent être regroupées.
- La page vendeur doit absorber plus d’états et d’actions.
- Une migration additive reste nécessaire.

### Option 2: Créer un nouveau service vendeur de réservations

Créer un module serveur dédié qui centralise toutes les lectures, commandes, transitions et notifications, puis faire pointer les nouvelles pages vers ce module.

**Pros**:
- Une frontière applicative claire autour du métier vendeur.
- Les règles sont testables sans passer par les routes HTTP.
- La croissance future du module est plus facile à suivre.

**Cons**:
- Duplique une partie des routes existantes et augmente le travail de migration.
- Le module doit encore connaître Drizzle, Neon, les stocks et les sessions.
- Le bénéfice n’est pas assez fort pour justifier une réécriture pendant une amélioration ciblée.

### Option 3: Remplacer le modèle de réservation par un modèle d’événements

Remplacer la ligne de réservation par un journal d’événements et reconstruire tous les écrans autour de cette nouvelle forme.

**Pros**:
- Historique technique très riche.
- Flexibilité pour ajouter de nouveaux événements.
- Les transitions pourraient être rejouées et auditées.

**Cons**:
- Migration risquée pour des codes et des lignes déjà en production.
- Nouvelle logique de lecture, de projection et de concurrence.
- Effort et risque sans nécessité pour les besoins seller actuellement confirmés.

## Rationale

L’option 1 répond directement aux écarts constatés. Le projet dispose déjà des tables, des routes, des sessions et des composants nécessaires. Réparer ces éléments permet de préserver les dashboards client et admin, les codes existants et les habitudes de travail.

La règle serveur centrale est nécessaire parce que les actions sont aujourd'hui dispersées entre `vendor`, `collect` et `cancel`. Sans une source unique, une transition valide dans un écran peut devenir invalide dans un autre, et le stock peut être modifié deux fois. Centraliser les transitions ne remplace pas les routes existantes. Il leur donne une règle commune et testable.

Les trois colonnes ajoutées sont proportionnées au besoin. La consigne client, la note vendeur et les services demandés ne peuvent pas être reconstruits à partir des autres colonnes. Ajouter une table séparée ou un document JSON créerait davantage de jointures et de cas de lecture pour un contexte limité à la réservation. Des colonnes facultatives ou dotées d’une valeur par défaut ne modifient pas les lignes anciennes.

Le cycle strict a été choisi parce qu’une réservation terminée doit rester dans l’historique et parce qu’une action libre peut passer une réservation collectée à confirmée sans consommer ni libérer le stock de façon cohérente. Les stocks sont mis à jour par condition SQL et par compensation, en attendant une transaction multi requête si le volume le justifie.

La suppression des notifications réutilise les routes existantes, car elles appliquent déjà la propriété du compte. Le risque principal n’est pas la requête de suppression, mais la confusion entre notification et donnée métier. La séparation des pages, des titres, des confirmations et des tables rend cette distinction visible et permet un test explicite.

## Audit evidence

### Routes et composants reservation

- `app/dashboard/depot/reservations/page.tsx` charge les données côté serveur, mais fournit seulement le nom d’un dépôt et aucune liste de points.
- `app/_components/vendor/vendor-reservations-manager.tsx` propose recherche, filtre de statut, vérification, confirmation, retrait, finalisation et annulation. Il n’a ni détail complet, ni filtre par point, ni statistiques, ni modification, ni suppression, ni confirmations.
- `app/api/reservation/vendor/route.ts` filtre la lecture par les points du vendeur. L’action vérifie `reservation.vendor_id`, mais accepte toutes les transitions et ne contrôle pas l’état précédent.
- `app/api/reservation/verify/route.ts` vérifie la propriété par le point et accepte les longueurs 10 et 12.
- `app/api/reservation/collect/route.ts` vérifie la propriété, refuse certains états et décrémente le stock physique et réservé.
- `app/api/reservation/cancel/route.ts` est une route client. Elle vérifie le propriétaire client, libère le stock et ne s’utilise pas côté vendeur.
- `app/api/reservation/scan/route.ts` impose encore exactement 10 caractères.
- `app/api/reservation/create/route.ts` déduit le point, le vendeur, la marque et le format de la disponibilité. Le travail non commité autorise aussi `a_confirmer`, mais le statut créé reste toujours `confirmed` et l’import `or` manque.
- `app/api/reservation/[id]/route.ts` permet au client de modifier la quantité d’une réservation confirmée et de supprimer seulement une réservation annulée.
- `lib/vendor-dashboard.ts` filtre les réservations vendeur par `vendor_id` et par les points possédés.

### Pages publiques

- `app/_components/disponibilite-modal.tsx` affiche la disponibilité, les services et les informations du client, puis envoie la disponibilité et la quantité à la création.
- `app/_components/reservation-modal.tsx` suit le même parcours pour une disponibilité issue d’une recherche.
- `lib/client-reservation.ts` envoie uniquement la disponibilité, la quantité et le type de montant.
- Aucun champ de consigne client ni de services demandés n’est transmis ou enregistré.

### Notifications et historique

- `app/api/notifications/[id]` supprime avec `id` et `user_id` de la session.
- `app/api/notifications/bulk` supprime avec la même condition de propriété et une liste d’identifiants limitée à 500.
- `app/_components/notifications/notification-center.tsx` offre déjà la suppression individuelle, la sélection multiple, tout sélectionner, tout désélectionner et la confirmation groupée.
- `app/_components/dashboard/history-page.tsx` montre seulement les réservations au vendeur. La page des notifications est séparée.
- `app/_components/notifications/notification-center.tsx` ne propose aucune suppression de réservation et ne touche que la table `notification`.

### Base de données

- `db/schema.ts` définit `reservation` avec `vendor_id`, `point_id`, `disponibilite_id`, le code unique, les informations client, le produit, le stock indirect et les horodatages.
- `drizzle/0010_reservation.sql` a créé la table et les index principaux.
- Aucun champ de consigne, de note vendeur ou de services demandés n’existe.
