/*
 * Service Worker GazPoints - Stratégie de cache sécurisée
 * - Mise en cache "stale-while-revalidate" pour les assets statiques
 * - Réseau-first pour les API et pages dynamiques (auth, session)
 * - Mise en cache refusée pour les pages sensibles
 * - Mise à jour en arrière-plan
 */

const CACHE_NAME = "gazpoints-v1";
const STATIC_ASSETS = [
  "/_next/static/css/*.css",
  "/_next/static/js/*.js",
  "/images/*.png",
  "/images/*.jpg",
  "/favicon.ico",
  "/web-app-manifest-*.png",
];

self.addEventListener("install", (event) => {
  // Pré-cacher les assets critiques au démarrage
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(
        STATIC_ASSETS.map((asset) => new Request(asset, { ignoreSearch: true }))
      );
    })
  );
  // Sauter l'attente pour activer le SW immédiatement
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Nettoyer les anciens caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    })
  );
  // Prendre le contrôle immédiatement
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Ne pas mettre en cache les requêtes cross-origin hors de notre contrôle
  if (url.origin !== self.origin) {
    // Laisser passer sans cache pour les ressources externes
    return;
  }

  // Stratégie : Réseau d'abord pour les API et pages sensibles
  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/verification") ||
    url.pathname.startsWith("/validation") ||
    url.pathname.startsWith("/inscription") ||
    url.pathname.startsWith("/connexion")
  ) {
    // Réseau-first : pas de cache, toujours frais
    event.respondWith(
      fetch(event.request).then((response) => {
        // Ne pas mettre en cache les réponses d'erreur 404/500
        if (!response || !response.ok) {
          return response;
        }
        // Optionnel : mettre en cache les réponses API GET en lecture seule
        // mais on interdit pour l'instant par sécurité
        return response;
      }).catch(() => {
        // En cas d'échec réseau, essayer le cache si disponible
        return caches.match(event.request).then((cached) => cached || null);
      })
    );
    return;
  }

  // Stratégie : stale-while-revalidate pour les assets statiques
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Retourner le cache immédiatement, mettre à jour en arrière-plan
        const fetchPromise = fetch(event.request).then((freshResponse) => {
          // Mettre à jour le cache (ignore les erreurs 404)
          try {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, freshResponse.clone());
            });
          } catch (e) {
            console.error("SW cache update error:", e);
          }
          return freshResponse;
        });
        return cachedResponse || fetchPromise;
      }

      // Sinon, aller au réseau et mettre en cache
      return fetch(event.request).then((fetchResponse) => {
        // Ne pas mettre en cache si non-ok
        if (!fetchResponse || !fetchResponse.ok) {
          return fetchResponse;
        }
        try {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone());
          });
        } catch (e) {
          console.error("SW cache add error:", e);
        }
        return fetchResponse;
      });
    })
  );
});