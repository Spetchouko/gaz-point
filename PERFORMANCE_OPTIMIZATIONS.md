# GazPoints - Optimisations de Performance

## Résumé des Optimisations Implémentées

### 1. Cache Côté Serveur (`lib/server-cache.ts`)

**Nouveau** : Cache en mémoire LRU avec TTL et invalidation par tags.

- **TTL par défaut** : 60 secondes
- **Taille max** : 500 entrées
- **Invalidation granulaire** : Par tags (reservations, availabilities, vendors, etc.)
- **Clés de cache structurées** : Pour recherche, réservations, overview vendeur, dashboard admin

**Fonctions d'invalidation automatique** :
- `invalidateOnReservationChange(userId, vendorId?)` - Après création/annulation réservation
- `invalidateOnAvailabilityChange(vendorId)` - Après modification disponibilité
- `invalidateOnPointChange(vendorId)` - Après modification point de vente

### 2. API Admin Dashboard (`app/api/admin/dashboard/route.ts`)

**Avant** : 100+ requêtes SQL par appel (boucles par jour pour graphiques)
**Après** : ~15 requêtes SQL par appel (GROUP BY agrégés)

Optimisations :
- **Graphique inscriptions** : 1 requête `GROUP BY DATE(createdAt), role` au lieu de N×2 requêtes
- **Graphique points de vente** : 1 requête `GROUP BY DATE(createdAt)` au lieu de N requêtes
- **Graphique disponibilités** : 1 requête `GROUP BY DATE(createdAt), status` au lieu de N×2 requêtes
- **Graphique réservations** : 1 requête `GROUP BY DATE(createdAt), status` au lieu de N×4 requêtes
- **Parallélisation** : Toutes les métriques KPI et graphiques récupérées via `Promise.all`
- **Cache serveur** : 60s TTL avec tag `admin`

**Gain estimé** : Réduction de ~90% du temps de réponse (100+ → ~15 requêtes)

### 3. API Recherche (`app/api/recherche/route.ts`)

**Avant** : Pas de pagination, filtres brand/format en JavaScript, pas de cache
**Après** : Pagination complète, filtres poussés en SQL, cache 30s

Optimisations :
- **Pagination** : Paramètres `page` et `pageSize` (défaut 20, max 50)
- **Filtres SQL** : Brand (ILIKE) et format (EQ) poussés en base
- **Comptage total** : Requête COUNT séparée pour pagination
- **Cache serveur** : 30s TTL par critères de recherche
- **Réponse enrichie** : `totalCount`, `totalPages`, `page`, `pageSize`

### 4. Service de Recherche Client (`lib/search-service.ts`)

**Avant** : Pas de support pagination
**Après** : Support pagination natif

- Méthode `search(criteria, { page, pageSize, signal })`
- `buildSearchUrl` accepte `page` et `pageSize`
- `SearchResponse` inclut `totalCount`, `totalPages`, `page`, `pageSize`

### 5. Notifications - Polling Optimisé (`lib/use-notification-unread-count.ts`)

**Avant** : Polling 30s + refresh sur CHAQUE focus/visibility change
**Après** : Polling 60s + debounce 5s (focus) / 2s (visibility)

- `POLLING_INTERVAL_MS` : 60_000 (au lieu de 30_000)
- `FOCUS_DEBOUNCE_MS` : 5_000
- `VISIBILITY_DEBOUNCE_MS` : 2_000
- Annulation requêtes en cours via `AbortController`

**Gain estimé** : Réduction de ~60% des appels API notifications

### 6. Vendor Dashboard (`lib/vendor-dashboard.ts`)

**Avant** : Requêtes séquentielles, pas de cache
**Après** : Parallélisation + Cache 60s

Optimisations `getVendorOverview` :
- `Promise.allSettled` pour les 4 requêtes principales (depots, counts, reservations, availabilities)
- Gestion d'erreurs granulaire par requête
- Cache serveur 60s avec tags `vendors`, `availabilities`, `reservations`
- Invalidation automatique via `invalidateOnAvailabilityChange`

### 7. Réservations Client (`app/api/reservation/my/route.ts`)

**Avant** : Pas de cache
**Après** : Cache 15s par utilisateur + pagination

- Cache key : `reservations:user:{userId}:{page}:{pageSize}`
- TTL : 15 secondes (court pour fraîcheur données privées)
- Invalidation auto via `invalidateOnReservationChange`

### 8. Création/Annulation Réservations - Invalidation Cache

**Routes modifiées** :
- `app/api/reservation/create/route.ts` - Invalide caches réservation + disponibilité
- `app/api/reservation/cancel/route.ts` - Invalide caches réservation + disponibilité

### 9. Pool de Connexions DB (`db/index.ts`)

**Avant** : `max: 10`, pas de timeouts configurés
**Après** : Optimisé serverless

- `max: 3` (au lieu de 10) - Évite épuisement connexions Vercel
- `idleTimeout: 10_000` - Libère connexions inactives en 10s
- `connectionTimeoutMs: 5_000` - Fail fast sur connexion
- `allowExitOnIdle: true` - Permet shutdown graceful
- Logs pool events (dev only)

## Mesures de Performance Attendues

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| Admin Dashboard API | ~2-5s | ~200-500ms | **80-90%** |
| Recherche (premier appel) | ~500ms | ~300ms | **40%** |
| Recherche (cache hit) | ~500ms | ~50ms | **90%** |
| Vendor Overview | ~800ms | ~300ms | **60%** |
| Notifications polling/jour | 2,880 appels | 1,440 appels | **50%** |
| Connexions DB simultanées | 10 max | 3 max | **70%** |

## Cache - Règles de Sécurité

✅ **DONNÉES PUBLIQUES/STATIQUES** : Cache longues durées (60s+)
✅ **DONNÉES DISPONIBILITÉS** : Cache court (30s) - fraîcheur critique
✅ **DONNÉES UTILISATEUR (réservations)** : Cache très court (15s) - données privées
❌ **PAS DE CACHE** : Authentification, permissions, mots de passe, sessions
✅ **INVALIDATION AUTOMATIQUE** : Après toute mutation (création/annulation réservation, modif dispo)

## Prochaines Optimisations Recommandées

1. **Index DB additionnels** : Analyser `EXPLAIN ANALYZE` sur requêtes lentes
2. **Prepared Statements** : Pour requêtes fréquentes (recherche, dashboard)
3. **Edge Caching** : Vercel Edge Cache pour assets statiques
4. **Compression** : Activer Brotli/Gzip pour réponses JSON
5. **Monitoring** : Ajouter Vercel Analytics + logs structurés
6. **Connection Pooler Neon** : Réactiver avec configuration optimisée (si ECONNRESET résolu)

## Fichiers Modifiés

```
lib/server-cache.ts                    # NOUVEAU - Cache serveur
app/api/admin/dashboard/route.ts       # OPTIMISÉ - Requêtes GROUP BY + cache
app/api/recherche/route.ts             # OPTIMISÉ - Pagination + filtres SQL + cache
lib/search-service.ts                  # OPTIMISÉ - Support pagination
lib/use-notification-unread-count.ts   # OPTIMISÉ - Polling 60s + debounce
lib/vendor-dashboard.ts                # OPTIMISÉ - Parallélisation + cache
app/api/reservation/my/route.ts        # OPTIMISÉ - Cache 15s
app/api/reservation/create/route.ts    # OPTIMISÉ - Invalidation cache
app/api/reservation/cancel/route.ts    # OPTIMISÉ - Invalidation cache
db/index.ts                            # OPTIMISÉ - Pool serverless
```