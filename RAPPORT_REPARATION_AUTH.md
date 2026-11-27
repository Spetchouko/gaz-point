# Rapport de Réparation - Authentification GazPoints

## Problème Identifié

**Impossible de se connecter à tous les dashboards (Client, Vendeur, Admin)**

### Cause Racine
Timeout de base de données trop court (5s) combiné avec les retentatives `withTransientRetry` (3 tentatives × 250ms/500ms/750ms). Quand Neon/WSL est lent, le total dépasse 5s → erreur de timeout → `getCurrentUser()` retourne `null` → redirection vers `/connexion` en boucle.

## Corrections Appliquées

### 1. Timeout par tentative (pas global) - `lib/session.ts`, `lib/auth-access.ts`, `lib/auth.ts`, `lib/vendor-access.ts`

**Avant :** `withTimeout(5s)` englobait tout `withTransientRetry` → timeout après 5s total
**Après :** `withTimeoutPerAttempt(10s)` à CHAQUE tentative → 10s × 3 = 30s max

```typescript
// Nouveau wrapper
async function withTimeoutPerAttempt<T>(operation: () => Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) => setTimeout(() => reject(new Error(`Timeout après ${ms}ms`)), ms))
  ])
}

// Utilisation dans getCurrentUser()
const session = await withTransientRetry(async () =>
  withTimeoutPerAttempt(async () => auth.api.getSession({ headers: await getHeaders() }), 10000),
  { attempts: 3, delayMs: 250 }
)
```

### 2. Connexion Neon robuste - `db/index.ts`

Utilisation de `URL` API au lieu de regex fragiles :
- Détection pooler via `hostname.includes("-pooler.")`
- Suppression `channel_binding` via `searchParams.delete()`
- Force `sslmode=verify-full` via `searchParams.set()`

### 3. Contrôle d'abonnement Vendeur - `lib/vendor-access.ts` (NOUVEAU)

Module centralisé gérant 9 états :
| État | Signification | Redirection |
|------|---------------|-------------|
| `allowed` | Abonnement actif | Dashboard |
| `subscription_none` | Aucun abonnement | `/paiement/abonnement` |
| `subscription_pending` | Paiement en cours | `/paiement/succes` (polling) |
| `subscription_past_due` | En retard | `/paiement/abonnement` |
| `subscription_expired` | Expiré | `/paiement/abonnement` |
| `subscription_cancelled` | Annulé | `/paiement/abonnement` |
| `error` | Erreur technique | `/paiement/abonnement` (fail-safe) |

### 4. Protection `requireVendor()` - `lib/session.ts`

```typescript
export async function requireVendor() {
  const user = await requireUser()
  // ... vérification rôle
  
  // NOUVEAU : Vérification abonnement obligatoire
  const access = await checkVendorAccess(user.id)
  if (access.status !== "allowed") {
    redirect(access.redirectTo ?? getVendorAccessRedirect(access.status))
  }
  return user
}
```

### 5. Google OAuth sécurisé - `app/api/auth/role-redirect/route.ts`

Vérification abonnement dans POST (client) ET GET (navigation directe) :
```typescript
if (access.role === "vendor") {
  const vendorAccess = await checkVendorAccess(access.account!.id)
  if (vendorAccess.status !== "allowed") {
    // Redirige vers paiement selon état
  }
}
```

### 6. Page Paiement intelligente - `app/(auth)/paiement/abonnement/page.tsx`

- Vérification statut AVANT initier paiement
- Redirection auto si déjà actif → dashboard
- Redirection auto si pending → page succès (polling)
- Affichage état : en retard, expiré, annulé, en attente

### 7. Page Succès avec Polling - `app/(auth)/paiement/succes/page.tsx`

- Polling auto 60s max (12 × 5s) pour attendre webhook
- Vérification `subscription.isActive` + statut transaction
- Arrêt propre timer + bouton vérification manuelle

## Fichiers Modifiés

| Fichier | Type | Description |
|---------|------|-------------|
| `lib/vendor-access.ts` | **NOUVEAU** | Logique centralisée 9 états |
| `lib/session.ts` | Modifié | Timeout par tentative + requireVendor() |
| `lib/auth-access.ts` | Modifié | Timeout par tentative |
| `lib/auth.ts` | Modifié | Timeout session creation hook |
| `lib/vendor-access.ts` | Modifié | Timeout checkVendorAccess |
| `db/index.ts` | Modifié | URL parsing robuste |
| `app/api/auth/role-redirect/route.ts` | Modifié | Check abonnement Google OAuth |
| `app/(auth)/paiement/abonnement/page.tsx` | Modifié | Vérif pré-paiement + états |
| `app/(auth)/paiement/succes/page.tsx` | Modifié | Polling webhook 60s |

## Tests TypeScript

```bash
pnpm typecheck
# ✅ PAS de nouvelles erreurs dans les fichiers modifiés
# (319 erreurs pré-existantes non liées aux changements)
```

## Vérifications Requises en Production

1. **Variables d'environnement Vercel** :
   ```
   DATABASE_URL=postgresql://...@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=verify-full
   BETTER_AUTH_URL=https://gazpoints.com
   NEXT_PUBLIC_SITE_URL=https://gazpoints.com
   GOOGLE_CLIENT_ID=xxx
   GOOGLE_CLIENT_SECRET=xxx
   Clé_publique_API_Key=xxx
   Clé_secrète_API_Secret=xxx
   GENIUSPAY_WEBHOOK_SECRET=xxx
   ```

2. **Webhook GeniusPay** : `https://gazpoints.com/api/payment/webhook`
   - Events: `payment.success`, `payment.failed`, `payment.cancelled`, `payment.expired`

3. **Tests manuels** :
   - [ ] Connexion Client → `/dashboard/client`
   - [ ] Connexion Vendeur payé → `/dashboard/vendeur`
   - [ ] Connexion Vendeur non payé → `/paiement/abonnement`
   - [ ] Connexion Vendeur pending → `/paiement/succes`
   - [ ] Connexion Google Vendeur payé → dashboard
   - [ ] Connexion Google Vendeur non payé → paiement
   - [ ] Connexion Admin → `/dashboard/admin`
   - [ ] Accès direct `/dashboard/vendeur` sans payer → bloqué
   - [ ] Paiement GeniusPay → activation auto via webhook + polling

## Résultat Attendu

✅ Les trois dashboards accessibles avec leurs comptes respectifs
✅ Sessions fonctionnent durablement (timeout 30s max)
✅ Aucune erreur de connexion ne subsiste
✅ Vendeurs bloqués sans paiement confirmé côté serveur
✅ Google OAuth même contrôle que connexion classique