# 0004. Reconstruction du dashboard vendeur GazPoints, raisonnement et inventaire

## Context

> ⚠️ Premise note : ta demande parle d'une reconstruction complète depuis zéro. Dans un système déjà en production avec des comptes, des points de vente, des disponibilités, des réservations, des paiements et des notifications, un remplacement direct complet est un motif de panne connu. Le bon cadrage est une reconstruction réelle de l'interface, livrée par tranches complètes, avec retrait de l'ancien code seulement après preuve que le nouveau fonctionne.

Le dashboard vendeur actuel ne montre pas ses propres menus. La route `/dashboard/vendeur/*` rend `DashboardClientLayout` sans lui transmettre la session ni le statut. Le shell en déduit donc un utilisateur non connecté et un profil client. Il en résulte la navigation client, un lien d'accueil vers `/dashboard/client`, un profil vers `/dashboard/profil` et un badge de notifications désactivé. Le même shell est rendu par le layout parent et par le layout vendeur, mais un garde fou basé sur le chemin évite le double rendu visuel. Le second `ThemeProvider` reste lui même dupliqué.

Le code vendeur est réparti entre `app/dashboard/vendeur`, `app/dashboard/depot`, `app/dashboard/reservations`, plusieurs composants de `app/_components` et des pages partagées. Plusieurs anciens composants de dashboard ne sont plus importés. Des menus vendeur sont codés directement dans le JSX du shell en plus d'une liste `VENDOR_NAV_ITEMS`. Cette situation crée des doublons et rend le comportement vendeur dépendant de détails du client.

Le backend est en grande partie réutilisable. Les routes dépôt, disponibilités, réservations, avis, profil, notifications et abonnement existent déjà et relisent la session côté serveur. Trois blocages subsistent pour les sept rubriques demandées : la modification du dépôt et de sa localisation, la modification d'une disponibilité existante, et l'exposition au vendeur de certains champs de service. Le schéma ne contient pas de champ coursier distinct. Tu as choisi de réutiliser la livraison existante pour ce service et de ne créer aucune migration.

Trois failles de sécurité doivent être corrigées avant la livraison de la nouvelle interface. Une route permet de modifier une réservation par simple identifiant sans vérifier le vendeur propriétaire. Une route de lecture de disponibilité ne filtre pas sur le propriétaire. Les routes de vérification de réservation vendeur sont classées comme partagées dans la navigation serveur, et la collecte exige un code de 12 caractères alors que les codes générés en contiennent 10. Le serveur de développement a aussi planté sur un cache Turbopack corrompu, avec une erreur d'auth liée à un module périmé. Le code source contient bien l'export attendu, donc la reprise doit se faire avec un cache propre.

La branche courante est `reprise/ok-compte-client` et contient beaucoup de travaux non commités. Tu as choisi de continuer sur cet état sans faire de `pull`. Toute récupération des commits de `origin/main` reste une décision séparée.

## Options considered

### Option 1 : Réparer l'interface vendeur actuelle sur place

Je garde les pages et composants existants, je corrige le passage de la session au shell, j'ajoute les quelques menus manquants et je comble les routes serveur absentes.

**Pros**
- Peu de fichiers touchés au départ.
- Le risque immédiat sur les autres dashboards est faible.
- Les données et les API restent inchangées.

**Cons**
- Les doublons de navigation et les composants morts restent en place.
- Le vendeur continue de dépendre du shell client, donc le comportement identique reste fragile.
- La demande d'interface entièrement neuve n'est pas satisfaite.

### Option 2 : Remplacement progressif avec strangler

Je construis un shell partagé et sept nouvelles rubriques vendeur, je bascule tranche par tranche, puis je retire les anciens fichiers seulement quand plus aucun import ne les utilise.

**Pros**
- Le comportement de navigation est implémenté une seule fois et paramétré par rôle.
- Les sept rubriques sont conçues ensemble, avec des états cohérents.
- La production reste utilisable pendant la migration et le retour arrière reste simple.
- Les corrections de sécurité arrivent avant l'exposition des nouvelles interfaces.

**Cons**
- Deux interfaces vendeur coexistent temporairement.
- Le travail touche davantage de fichiers.
- Une phase de vérification finale est nécessaire avant le retrait de l'ancien code.

### Option 3 : Remplacement direct complet

Je supprime l'ancien dashboard vendeur en une seule passe, puis j'écris toutes les pages nouvelles avant de tester.

**Pros**
- Le résultat final est conceptuellement simple, sans ancien code résiduel.
- La liste des fichiers touchés est claire sur le papier.

**Cons**
- Aucune tranche intermédiaire utilisable pendant le développement.
- Une erreur sur une rubrique bloque tout le dashboard vendeur.
- Le risque de casser les routes client ou admin est plus élevé, car les shells partagent déjà plusieurs fichiers.
- Le retour arrière est plus douloureux avec beaucoup de travaux non commités.

## Rationale

L'option 2 est la plus adaptée aux forces réelles du projet. Le système est déjà en production, les données sont précieuses et la branche contient des travaux non commités. Une reconstruction par tranches permet de prouver chaque rubrique avant de retirer l'ancien code, donc de livrer une interface réellement neuve sans transformer la migration en risque majeur.

L'option 1 est insuffisante car elle conserve la cause racine du bug de navigation : le vendeur dépend du shell client et de la présence de props de session. L'option 3 séduit par sa simplicité affichée, mais elle ignore les trois shells quasi identiques déjà présents et la fragilité du garde fou actuel. Le remplacement progressif respecte aussi ton choix de conserver les API, les règles métier et l'authentification existantes.

Le shell partagé paramétré par rôle est le seul moyen simple d'obtenir exactement le même comportement de navigation sans remplacer les menus vendeur par les menus client. Les pages serveur qui lisent les données puis passent des props gardent le contrôle d'accès côté serveur et évitent de disperser la logique métier dans le navigateur. Les routes serveur ajoutées sont limitées aux actions que l'API actuelle ne couvre pas, afin de respecter ton choix de réutiliser l'existant.

Le service coursier reste porté par `deliveryEnabled` et `deliveryFee`. Cette décision découle de ton choix de ne pas créer de migration et de ta validation de la réutilisation de la livraison existante. Le contact par dépôt s'appuie sur le téléphone et l'adresse déjà présents dans `point_de_vente`. Ces choix évitent d'introduire une table ou une colonne fantôme qui ne serait pas alignée avec les données réelles.

Aucune référence externe n'est ajoutée, conformément à ton choix.

## Decisions already confirmed

- Remplacer la spec 0003 par une nouvelle spec de reconstruction.
- Prendre le dashboard client actuel comme source de comportement de navigation, avec une organisation inspirée d'Outlook.
- Continuer sur la branche courante sans `pull`.
- Garder les sept rubriques dans l'ordre demandé.
- Calculer les statistiques depuis le début, sans filtre de date.
- Dériver les dernières activités des réservations et disponibilités existantes.
- Extraire un shell partagé paramétré par rôle avec une configuration vendeur distincte.
- Faire lire les données par des pages serveur qui passent des props aux composants interactifs.
- Afficher une carte d'accueil guidée quand le vendeur n'a aucune donnée.
- Ne créer aucune migration de schéma.
- Réutiliser les API existantes et n'ajouter que les routes vendeur manquantes.
- Appliquer un contrôle serveur strict sur chaque page et chaque action.
- Prévoir squelettes, erreur avec nouvelle tentative, état vide et toast de succès.
- Ajouter les API vendeur manquantes pour dépôt et disponibilité.
- Compléter le backend vendeur pour les services, sans modifier les droits des autres rôles.
- Réutiliser la livraison existante pour le coursier.
- Ne pas inclure de section Références dans la spec.

## Audit inventory

### Routes vendeur à reconstruire ou à relier

- `/dashboard/vendeur` et `/dashboard/vendeur/profil`.
- `/dashboard/vendeur/notifications`, `/dashboard/vendeur/parametres` et `/dashboard/vendeur/historique`.
- `/dashboard/depot`, `/dashboard/depot/disponibilites`, `/dashboard/depot/services` et `/dashboard/depot/reservations`.
- `/dashboard/reservations/vendor` et `/dashboard/reservations/verify`.
- Pages partagées utilisées par le vendeur : historique, notifications, avis et paramètres.

### Shell et navigation

- `app/_components/dashboard/client-layout.tsx` contient `CLIENT_NAV_ITEMS`, `VENDOR_NAV_ITEMS`, la sidebar, les headers, l'overlay mobile et le footer.
- Deux liens vendeur sont codés directement dans son JSX et doivent entrer dans la configuration `VENDOR_NAV_ITEMS`.
- `app/_components/dashboard/admin-layout-new.tsx` et `collaborateur-layout.tsx` dupliquent le shell. Elles ne doivent pas être réécrites dans ce chantier.
- `app/dashboard/layout.tsx` court circuite la coquille générique pour les préfixes admin, vendeur et collaborateur.
- `app/dashboard/vendeur/layout.tsx` rend un second `ThemeProvider` et n'envoie ni session ni statut au shell.
- `ScrollToTop` écoute `window.scrollY` alors que le contenu défile dans `main`. Ce point doit être vérifié pendant le test navigateur.

### API et données à conserver absolument

- Routes dépôt : création, lecture du sien, bascule des services, onboarding.
- Routes disponibilités : lecture du sien, création ou mise à jour, bascule de statut.
- Routes réservations : liste vendeur, vérification, scan, collecte, création et annulation côté client, webhook de paiement.
- Routes avis, profil, mot de passe, avatar, préférences, abonnement et notifications.
- Tables `user`, `session`, `point_de_vente`, `disponibilite`, `brand`, `point_de_vente_bouteille`, `vendor_onboarding`, `recharge`, `admin_action`, `collaborateur_permission`, `avis`, `reservation`, `vendor_subscription`, `payment_transaction`, `notification` et `user_preference`.
- Règle de publication directe du vendeur après vérification du compte, sans approbation administrative obligatoire.

### Anciens composants candidats au retrait

Ces fichiers n'ont pas d'import résolu dans l'état audité. Le retrait doit rester conditionnel à une nouvelle vérification des imports au moment de la suppression.

- `app/_components/dashboard/admin-layout.tsx`
- `app/_components/dashboard/stat-card.tsx`
- `app/_components/dashboard/recent-activity.tsx`
- `app/_components/dashboard/users-pie.tsx`
- `app/_components/dashboard/points-chart.tsx`
- `app/_components/dashboard/geographic-chart.tsx`
- `app/_components/dashboard/disponibilites-chart.tsx`
- `app/_components/dashboard/inscriptions-chart.tsx`
- `app/_components/dashboard/period-filter.tsx`
- `app/_components/dashboard/profile-page.tsx`
- `app/_components/dashboard/user-avatar.tsx`
- `app/_components/bottle-format-selector.tsx`
- `app/_components/bottle-format-search-field.tsx`

Le composant `animated-counter.tsx` est encore consommé par `stat-card.tsx`. Sa suppression doit donc être décidée après celle de `stat-card.tsx`.

### Défauts déjà identifiés

- `POST /api/reservation/vendor` met à jour une réservation par identifiant sans filtre de propriété.
- `GET /api/disponibilite/[id]` ne filtre pas sur le vendeur ni sur un dépôt lui appartenant.
- `POST /api/reservation/collect` exige un code de 12 caractères alors que les codes générés en contiennent 10.
- `/dashboard/reservations/vendor` et `/dashboard/reservations/verify` sont classés comme partagés dans `lib/auth-routing.ts`.
- `settings-page.tsx` utilise `Trash2` sans import et `history-page.tsx` appelle une méthode de chaîne inexistante. Ces défauts sont hors périmètre sauf s'ils bloquent une page vendeur.
- Le filtrage des avis administratifs combine ses conditions avec `or` au lieu de `and`. Ce défaut est hors périmètre.
