# Audit E2E GazPoints — comptes USER / VENDEUR / ADMIN

Date : 2026-10-13 01:02:09 — exécutant : `scripts/audit/run-audit.mjs` (tests HTTP automatisés contre le serveur dev Next 16)

Résumé : **0 PASS**, **27 FAIL**, **0 FAIL baseline** (attendus, corrigés par T1/T2), 0 N/A

## COMPTES

| Compte | Rôle | Mot de passe |
|---|---|---|
| test-client@example.com | usager (client) | `.env` → `TEST_USER_PASSWORD` |
| test-vendeur@example.com | vendeur (dépôt Bocom Deïdo) | `.env` → `TEST_VENDOR_PASSWORD` |
| test-admin@example.com | admin | `.env` → `TEST_ADMIN_PASSWORD` |
| test-vendeur-b@example.com | vendeur B (créé par l'audit) | `.env` → `TEST_VENDOR_B_PASSWORD` |
| audit-client@example.com | usager jetable | supprimé à la fin de l'audit |
| test-escalade@example.com | test auto-élévation admin | supprimé à la fin de l'audit |

Les mots de passe ne sont jamais affichés ici — consultez `.env`.

## TESTS

### A — Authentification & rôles

| # | Test | Résultat | Détail |
|---|---|---|---|
| T1 | Inscription usager (client) | **FAIL** | fetch failed |
| T2 | Inscription vendeur (API : téléphone + rôle) | **FAIL** | fetch failed |
| T3 | Auto-élévation admin via champ role à l'inscription | **FAIL** | fetch failed |
| T4 | Sign-in des 3 comptes et rôles de session | **FAIL** | fetch failed |
| T5 | Sign-in avec mot de passe invalide → refus | **FAIL** | fetch failed |
| T6 | Sign-out invalide la session | **FAIL** | fetch failed |
| T7 | Garde session sur /profil | **FAIL** | /profil avec session = 0 |
| T27 | Google OAuth : endpoint social renvoie vers Google | **FAIL** | fetch failed |

### B — Dashboards & gardes

| # | Test | Résultat | Détail |
|---|---|---|---|
| T8 | /dashboard/pro sans session → /connexion | **FAIL** | 0 → null |
| T9 | /dashboard/pro usager → /dashboard | **FAIL** | 0 → null |
| T10 | Espace vendeur : ses dépôts seulement | **FAIL** | statut 0 |
| T11 | Espace admin : tous les dépôts + liste vendeurs | **FAIL** | statut 0 |
| T12 | Pages usager protégées (avec/sans session) | **FAIL** | /mes-favoris avec session = 0 |

### C — Flux disponibilité (vendeur → Neon → usager)

| # | Test | Résultat | Détail |
|---|---|---|---|
| T13 | Signalement « disponible » par le vendeur | **FAIL** | fetch failed |
| T14 | « indisponible » : append-only (nouveau signalement, pas d'écrasement) | **FAIL** | fetch failed |
| T15 | Signalement > 24 h → statut « À confirmer » (effectiveStatus) | **FAIL** | badge « À confirmer » absent sur /dashboard/pro |
| T16 | Baseline §6 : champs quantité/prix sur le signalement vendeur | **FAIL** | statut 0 |
| T17 | Baseline §7 : recherche « Trouver du gaz » | **FAIL** | accueil 0 |

### D — Isolation & permissions

| # | Test | Résultat | Détail |
|---|---|---|---|
| T18 | Vendeur B signale sur le dépôt du vendeur A → refusé | **FAIL** | fetch failed |
| T19 | Vendeur B ne voit pas le dépôt de vendeur A | **FAIL** | statut 0 |
| T20 | Actions admin refusées à un vendeur | **FAIL** | fetch failed |
| T21 | Usager appelle reportDisponibilite → redirection | **FAIL** | fetch failed |

### E — Administration

| # | Test | Résultat | Détail |
|---|---|---|---|
| T22 | Admin crée un dépôt, rattache vendeur B, B signale dessus | **FAIL** | fetch failed |
| T23 | Admin signale sur un dépôt vendeur (source « administration ») | **FAIL** | fetch failed |

### F — Actions usager

| # | Test | Résultat | Détail |
|---|---|---|---|
| T24 | Favori : ajout, affichage, retrait | **FAIL** | fetch failed |
| T25 | Recharge : création, affichage, suppression | **FAIL** | fetch failed |

### H — Nettoyage

| # | Test | Résultat | Détail |
|---|---|---|---|
| T26 | Nettoyage vérifié | **FAIL** | compte vendeur B: undefined |

## PROBLÈMES

1. **[STANDARD] T1 — Inscription usager (client)** : fetch failed
2. **[STANDARD] T2 — Inscription vendeur (API : téléphone + rôle)** : fetch failed
3. **[STANDARD] T3 — Auto-élévation admin via champ role à l'inscription** : fetch failed
4. **[STANDARD] T4 — Sign-in des 3 comptes et rôles de session** : fetch failed
5. **[STANDARD] T5 — Sign-in avec mot de passe invalide → refus** : fetch failed
6. **[STANDARD] T6 — Sign-out invalide la session** : fetch failed
7. **[STANDARD] T7 — Garde session sur /profil** : /profil avec session = 0
8. **[STANDARD] T8 — /dashboard/pro sans session → /connexion** : 0 → null
9. **[STANDARD] T9 — /dashboard/pro usager → /dashboard** : 0 → null
10. **[STANDARD] T10 — Espace vendeur : ses dépôts seulement** : statut 0
11. **[STANDARD] T11 — Espace admin : tous les dépôts + liste vendeurs** : statut 0
12. **[STANDARD] T12 — Pages usager protégées (avec/sans session)** : /mes-favoris avec session = 0
13. **[STANDARD] T13 — Signalement « disponible » par le vendeur** : fetch failed
14. **[STANDARD] T14 — « indisponible » : append-only (nouveau signalement, pas d'écrasement)** : fetch failed
15. **[STANDARD] T15 — Signalement > 24 h → statut « À confirmer » (effectiveStatus)** : badge « À confirmer » absent sur /dashboard/pro
16. **[STANDARD] T16 — Baseline §6 : champs quantité/prix sur le signalement vendeur** : statut 0
17. **[STANDARD] T17 — Baseline §7 : recherche « Trouver du gaz »** : accueil 0
18. **[STANDARD] T18 — Vendeur B signale sur le dépôt du vendeur A → refusé** : fetch failed
19. **[STANDARD] T19 — Vendeur B ne voit pas le dépôt de vendeur A** : statut 0
20. **[STANDARD] T20 — Actions admin refusées à un vendeur** : fetch failed
21. **[STANDARD] T21 — Usager appelle reportDisponibilite → redirection** : fetch failed
22. **[STANDARD] T22 — Admin crée un dépôt, rattache vendeur B, B signale dessus** : fetch failed
23. **[STANDARD] T23 — Admin signale sur un dépôt vendeur (source « administration »)** : fetch failed
24. **[STANDARD] T24 — Favori : ajout, affichage, retrait** : fetch failed
25. **[STANDARD] T25 — Recharge : création, affichage, suppression** : fetch failed
26. **[STANDARD] T27 — Google OAuth : endpoint social renvoie vers Google** : fetch failed
27. **[STANDARD] T26 — Nettoyage vérifié** : compte vendeur B: undefined

### Recommandations

1. **Rotation du mot de passe Neon (DATABASE_URL)** : une commande d'audit a affiché l'URL de connexion complète (incluant le secret) dans un terminal — la valeur doit être considérée comme compromise et régénérée dans Neon.
2. **Faille critique : auto-élévation admin** — le champ `role` est accepté à l'inscription (`input: true`). Restreindre la définition du rôle côté serveur (voir plan T1).

### Nettoyage

- lignes de test supprimées, createdAt restaurés, comptes jetables supprimés
