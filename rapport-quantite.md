Rapport : suppression du champ Quantité

Fichiers modifiés :
- app/_components/disponibilite-form.tsx (champ + état + validation retirés)
- app/_components/admin-disponibilite-form.tsx (champ retiré)
- app/_components/recherche-gaz.tsx (affichage supprimé + condition réservation corrigée)
- app/dashboard/pro/actions.ts (validation et insertion quantity retirées)
- app/admin/actions.ts (validation quantity retirée)

Base de données : colonne quantity conservée (pas supprimée, pas de migration destructive)

Tests : formulaire sans champ Quantité, résultats de recherche sans affichage de quantité, réservation fonctionnelle sans dépendance à quantity, design et charte graphique préservés.
