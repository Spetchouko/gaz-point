# Contrat API — Recherche de gaz GazPoints

Ce document décrit l'interface entre le frontend de recherche et le futur
backend. Il sert de référence pour l'équipe qui développera le backend
et pour le frontend qui consommera les réponses.

## 1. Principe général

Le frontend de recherche est prêt à communiquer avec un backend via des
requêtes HTTP GET/JSON. Tant que le backend n'est pas développé, le frontend
continue d'utiliser les routes Next.js internes (`/api/recherche` et
`/api/disponibilites`).

Aucune URL d'API fictive n'est codée en dur. L'URL du backend se configure
via la variable d'environnement `NEXT_PUBLIC_SEARCH_API_URL`.

## 2. Variables d'environnement

| Variable | Description | Obligatoire | Valeur par défaut |
|----------|-------------|-------------|-------------------|
| `NEXT_PUBLIC_SEARCH_API_URL` | URL de base du backend de recherche | Non | Routes Next.js internes |

Exemple : `NEXT_PUBLIC_SEARCH_API_URL=https://api.gazpoints.com`

## 3. Endpoints

### 3.1 Recherche de points de vente

**GET** `{BASE_URL}/search`

Paramètres de requête :

| Paramètre | Type | Obligatoire | Description |
|-----------|------|-------------|-------------|
| `brand` | string | Non | Marque de bouteille (ex: "Total", "Tradex") |
| `format` | string | Non | Format de bouteille (ex: "6 kg", "12,5 kg", "15 kg") |
| `zone` | string | Non | Quartier, ville ou point de repère (ex: "Akwa", "Bonamoussadi") |
| `limit` | number | Non | Nombre max de résultats (1-100, défaut 50) |
| `offset` | number | Non | Décalage pour pagination (défaut 0) |

**Réponse (200 OK)** :

```json
{
  "results": [
    {
      "id": "uuid",
      "name": "Tradex Bonamoussadi",
      "district": "Bonamoussadi",
      "address": "Rond-point Bonamoussadi",
      "phone": "+237 6 99 12 34 56",
      "brands": ["Tradex"],
      "formats": ["12,5 kg"],
      "status": "disponible",
      "note": null,
      "quantity": 15,
      "price": 6500,
      "format": "12,5 kg",
      "brand": "Tradex",
      "expiresAt": "2026-12-15T10:00:00Z",
      "updatedAt": "2026-11-10T08:30:00Z",
      "updatedBy": "Jean Dupont",
      "source": "vendeur",
      "stale": false,
      "expired": false,
      "disponibiliteId": "uuid",
      "hasDelivery": true,
      "hasExchange": false,
      "hasGasSale": false,
      "deliveryFee": 1000,
      "vendorId": "uuid",
      "vendorName": "Jean Dupont",
      "deliveryEnabled": true,
      "deliveryFeePoint": 1000,
      "exchangeEnabled": false,
      "gasSaleEnabled": false
    }
  ],
  "total": 42,
  "limit": 50,
  "offset": 0
}
```

### 3.2 Données de service des disponibilités

**GET** `{BASE_URL}/disponibilites?ids={id1}&ids={id2}...`

Récupère les données de service (livraison, échange, gaz sale, frais) pour
une liste de disponibilités.

Paramètres : `ids` (répété pour chaque disponibilité).

**Réponse (200 OK)** :

```json
[
  {
    "id": "uuid",
    "delivery": true,
    "exchange": false,
    "gasSale": false,
    "price": 1000
  }
]
```

## 4. Statuts de disponibilité

| Statut | Description | Badge couleur |
|--------|-------------|---------------|
| `disponible` | Bouteille disponible immédiatement | Vert |
| `a_confirmer` | Disponibilité à confirmer (ancienne ou non vérifiée) | Orange |
| `indisponible` | Bouteille indisponible | Rouge |

## 5. Codes d'erreur

Le backend doit retourner les codes HTTP standards :

| Code | Signification |
|------|---------------|
| 200 | Succès |
| 400 | Requête invalide (paramètres manquants ou incorrects) |
| 401 | Authentification requise |
| 403 | Accès interdit |
| 429 | Trop de requêtes (rate limiting) |
| 500 | Erreur serveur interne |

En cas d'erreur, le corps de la réponse doit être :

```json
{
  "error": {
    "message": "Description lisible de l'erreur",
    "code": "CODE_ERREUR",
    "retryAfter": 60
  }
}
```

## 6. Pagination

- `limit` : nombre maximum de résultats par page (défaut 50, max 100).
- `offset` : nombre de résultats à ignorer (défaut 0).
- `total` : nombre total de résultats disponibles (indépendant de `limit`).

Le frontend calcule le nombre de pages : `Math.ceil(total / limit)`.

## 7. Règles de validation

- `brand` : max 100 caractères.
- `format` : max 50 caractères.
- `zone` : max 200 caractères.
- `limit` : entier entre 1 et 100.
- `offset` : entier positif.

## 8. Flux de recherche

1. L'utilisateur saisit les critères (marque, format, zone).
2. L'utilisateur clique sur "Rechercher" ou appuie sur Entrée.
3. Le frontend valide les critères côté client.
4. Le frontend appelle `GET /search` avec les paramètres.
5. Le backend interroge la base de données et retourne les résultats.
6. Le frontend affiche les résultats ou un état vide/erreur.

## 9. États attendus par le frontend

| État | Condition | Affichage |
|------|-----------|-----------|
| Inactif | Aucune recherche effectuée | Formulaire vide |
| Recherche en cours | Requête en cours | Indicateur de chargement |
| Résultats disponibles | `results.length > 0` | Grille de cartes |
| Aucun résultat | `results.length === 0` | Message "Aucun gaz disponible" |
| Erreur | Requête échouée | Message d'erreur avec bouton "Réessayer" |

## 10. Données de test

Lors du développement du backend, les données de test doivent être
clairement identifiées comme fictives et ne jamais être présentées comme
des disponibilités réelles en production.

Exemple de point de vente de test :

```json
{
  "id": "test-1",
  "name": "Point de vente test",
  "district": "Bonamoussadi",
  "address": "Rond-point Bonamoussadi",
  "phone": "+237 6 99 12 34 56",
  "brands": ["Tradex"],
  "formats": ["12,5 kg"],
  "status": "disponible",
  "quantity": 10,
  "price": 6500,
  "format": "12,5 kg",
  "brand": "Tradex",
  "expiresAt": null,
  "updatedAt": "2026-11-10T08:00:00Z",
  "updatedBy": "Test",
  "source": "vendeur",
  "stale": false,
  "expired": false,
  "disponibiliteId": "test-1",
  "hasDelivery": true,
  "hasExchange": false,
  "hasGasSale": false,
  "deliveryFee": 1000,
  "vendorId": "test-vendor-1",
  "vendorName": "Jean Dupont",
  "deliveryEnabled": true,
  "deliveryFeePoint": 1000,
  "exchangeEnabled": false,
  "gasSaleEnabled": false
}
```

## 11. Sécurité

- Aucune clé secrète ne doit être exposée dans le frontend.
- L'authentification est gérée côté serveur (session/cookie).
- Les requêtes de recherche nécessitent un utilisateur authentifié
  (vérifié par le backend Next.js actuel).
- Les paramètres de requête doivent être validés et sanitized côté
  backend.
