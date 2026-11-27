# Audit Complet - Authentification Vendeur & Paiement GazPoints

## Problèmes Critiques Identifiés

### 1. Connexion Vendeur - Chargement Infini
**Cause racine**: `requireVendor()` → `requireUser()` → `getCurrentUser()` effectue 3 requêtes DB séquentielles avec `withTransientRetry`:
- `auth.api.getSession()` (Better Auth)
- `db.select().from(user)...` (profil utilisateur)
- Session hook dans `auth.ts` (vérification isActive, emailVerified, rôle)

Si Neon/pooler retourne `ECONNRESET`, `withTransientRetry` relance 3 fois (250ms, 500ms, 750ms) → 1.5s minimum avant échec. Pas d'affichage d'erreur côté client → "chargement infini".

### 2. Absence de Contrôle d'Abonnement (Fail Open)
**Fichiers concernés**: `lib/session.ts` (`requireVendor`), `app/dashboard/vendeur/layout.tsx`

Le code ne vérifie **jamais** le statut d'abonnement:
```typescript
// requireVendor() - LIGNE 162-173
export async function requireVendor() {
  const user = await requireUser()  // Vérifie seulement rôle + emailVerified + isActive
  if (user.role !== "vendor") { redirect(...) }
  return user  // PAS de vérification d'abonnement !
}
```

Un vendeur sans abonnement actif accède librement au dashboard.

### 3. Google OAuth Contourne le Paiement
**Flux**: `/connexion` → `authClient.signIn.social({provider: "google", callbackURL: "/api/auth/role-redirect"})`

`/api/auth/role-redirect` appelle `getAuthenticatedAccountAccess()` qui utilise `evaluateAccountAccess()` → **pas de vérification d'abonnement**.

### 4. Race Condition Webhook vs Page Succès
- Page `/paiement/succes` appelle `/api/payment/verify/{reference}` immédiatement
- Webhook `/api/payment/webhook` traite l'événement `payment.success` de façon asynchrone
- Si page vérifie avant webhook → statut `pending` affiché à l'utilisateur
- Pas de synchronisation ni d'attente active côté client

### 5. Connexion Neon Instable (WSL)
- Pool Neon (`-pooler.`) cause `ECONNRESET` depuis WSL
- Correction partielle dans `db/index.ts` mais pas testée
- `sslmode=require` au lieu de `verify-full` (avertissement pg v9+)

### 6. Pas de Middleware de Protection Globale
- Protection uniquement au niveau layout (`requireVendor()`)
- Routes API vendeur non protégées par abonnement
- Accès direct aux URLs dashboard possible sans vérification

---

## Plan de Correction

### Phase 1: Contrôle d'Accès Centralisé (Priorité 1)
1. Créer `lib/vendor-access.ts` - logique unique de vérification vendeur+abonnement
2. Modifier `requireVendor()` pour vérifier l'abonnement
3. Modifier `/api/auth/role-redirect` pour bloquer vendeurs non payés
4. Ajouter vérification dans layout vendeur

### Phase 2: Correction Connexion & Performance
1. Optimiser `getCurrentUser()` - une seule requête DB
2. Ajouter timeout et fallback sur erreurs Neon
3. Afficher message d'erreur explicite côté client

### Phase 3: Sécurisation Paiement
1. Attendre confirmation webhook avant d'afficher "succès" page paiement
2. Vérification serveur stricte signature webhook (déjà OK)
3. Prévention double paiement (déjà OK via webhook)
4. Gestion états: NON_PAYÉ, EN_ATTENTE, PAYÉ, ÉCHOUÉ, EXPIRÉ

### Phase 4: Google OAuth
1. Même contrôle abonnement que connexion classique
2. Redirection vers `/paiement/abonnement` si non payé
3. Affichage état paiement en attente

### Phase 5: Tests & Build
1. `pnpm build` réussi
2. Scénarios de test validés

---

## Fichiers à Modifier

| Fichier | Action |
|---------|--------|
| `lib/vendor-access.ts` | **NOUVEAU** - Logique centralisée vérification vendeur+abonnement |
| `lib/session.ts` | Modifier `requireVendor()` pour utiliser `vendor-access` |
| `app/api/auth/role-redirect/route.ts` | Ajouter vérification abonnement pour rôle vendor |
| `app/dashboard/vendeur/layout.tsx` | Double vérification (ceinture et bretelles) |
| `lib/auth-routing.ts` | Ajouter statut abonnement dans `AccountAccessDecision` |
| `lib/auth-access.ts` | Utiliser nouvelle logique pour vendeurs |
| `db/index.ts` | Corriger URL Neon (direct + verify-full) |
| `app/(auth)/paiement/succes/page.tsx` | Attendre webhook / polling intelligent |
| `app/(auth)/paiement/abonnement/page.tsx` | Vérifier état avant d'initialiser paiement |