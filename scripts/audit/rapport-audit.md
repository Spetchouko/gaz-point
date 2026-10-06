# Audit E2E GazPoint — comptes USER / VENDEUR / ADMIN

Date : 2026-10-06 13:47:06 — exécutant : `scripts/audit/run-audit.mjs` (tests HTTP automatisés contre le serveur dev Next 16)

Résumé : **27 PASS**, **0 FAIL**, **0 FAIL baseline** (attendus, corrigés par T1/T2), 0 N/A

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
| T1 | Inscription usager (client) | **PASS** | compte créé, sign-in + session rôle client OK |
| T2 | Inscription vendeur (API : téléphone + rôle) | **PASS** | rôle vendor + téléphone enregistrés, UI /inscription OK |
| T3 | Auto-élévation admin via champ role à l'inscription | **PASS** | tentative role=admin neutralisée : rôle stocké « client » |
| T4 | Sign-in des 3 comptes et rôles de session | **PASS** | client/vendor/admin : sign-in 200 + rôles OK |
| T5 | Sign-in avec mot de passe invalide → refus | **PASS** | 401 |
| T6 | Sign-out invalide la session | **PASS** | session invalidée |
| T7 | Garde session sur /profil | **PASS** | 200 avec session, 307 /connexion sans |
| T27 | Google OAuth : endpoint social renvoie vers Google | **PASS** | 200 → accounts.google.com avec client_id (config GOOGLE_* lue) |

### B — Dashboards & gardes

| # | Test | Résultat | Détail |
|---|---|---|---|
| T8 | /dashboard/pro sans session → /connexion | **PASS** | 307 /connexion |
| T9 | /dashboard/pro usager → /dashboard | **PASS** | 307 /dashboard |
| T10 | Espace vendeur : ses dépôts seulement | **PASS** | 200, Bocom présent, 4 point(s) d'autres vendeurs non visibles |
| T11 | Espace admin : tous les dépôts + liste vendeurs | **PASS** | 200, formulaire admin + dépôts + vendeurs présents |
| T12 | Pages usager protégées (avec/sans session) | **PASS** | /mes-favoris, /mes-commandes, /profil : 200 / 307 OK |

### C — Flux disponibilité (vendeur → Neon → usager)

| # | Test | Résultat | Détail |
|---|---|---|---|
| T13 | Signalement « disponible » par le vendeur | **PASS** | action ok, ligne signée vendeur, badge affiché |
| T14 | « indisponible » : append-only (nouveau signalement, pas d'écrasement) | **PASS** | append-only OK (3→4), dernier = indisponible, badge affiché |
| T15 | Signalement > 24 h → statut « À confirmer » (effectiveStatus) | **PASS** | stale > 24 h → À confirmer + avertissement sur les deux espaces |
| T16 | Baseline §6 : champs quantité/prix sur le signalement vendeur | **PASS** | champs quantité/prix/format présents et stockés en base |
| T17 | Baseline §7 : recherche « Trouver du gaz » | **PASS** | API OK : 1 résultat(s) pour Deïdo, 5 au total |

### D — Isolation & permissions

| # | Test | Résultat | Détail |
|---|---|---|---|
| T18 | Vendeur B signale sur le dépôt du vendeur A → refusé | **PASS** | refusé, aucune ligne insérée |
| T19 | Vendeur B ne voit pas le dépôt de vendeur A | **PASS** | 200 sans dépôt d'autrui ni outils admin |
| T20 | Actions admin refusées à un vendeur | **PASS** | createPointDeVente + assignVendor refusés, rien modifié |
| T21 | Usager appelle reportDisponibilite → redirection | **PASS** | redirect /dashboard, aucune ligne |

### E — Administration

| # | Test | Résultat | Détail |
|---|---|---|---|
| T22 | Admin crée un dépôt, rattache vendeur B, B signale dessus | **PASS** | création + rattachement + signalement du vendeur B OK |
| T23 | Admin signale sur un dépôt vendeur (source « administration ») | **PASS** | admin peut signaler, source=administration |

### F — Actions usager

| # | Test | Résultat | Détail |
|---|---|---|---|
| T24 | Favori : ajout, affichage, retrait | **PASS** | ajout → (1) → retrait → (0) |
| T25 | Recharge : création, affichage, suppression | **PASS** | création → affichage → suppression OK |

### H — Nettoyage

| # | Test | Résultat | Détail |
|---|---|---|---|
| T26 | Nettoyage vérifié | **PASS** | Bocom restauré, jetables supprimés, vendeur B conservé (voir .env) |

## PROBLÈMES

Aucun échec hors baseline.

### Recommandations

1. **Rotation du mot de passe Neon (DATABASE_URL)** : une commande d'audit a affiché l'URL de connexion complète (incluant le secret) dans un terminal — la valeur doit être considérée comme compromise et régénérée dans Neon.

### Nettoyage

- lignes de test supprimées, createdAt restaurés, comptes jetables supprimés
