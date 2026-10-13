// @ts-nocheck
/*
 * Service Worker GazPoints - Stratégie de cache sécurisée
 * - Mise en cache "stale-while-revalidate" pour les assets statiques
 * - Réseau-first pour les API et pages dynamiques (auth, session)
 * - Mise en cache refusée pour les pages sensibles
 * - Mise à jour en arrière-plan
 */

const CACHE_NAME = "gazpoints-v1"
const STATIC_ASSETS = [
  "/_next/static/css/*.css",
  "/_next/static/js/*.js",
  "/images/*.png",
  "/images/*.jpg",
  "/favicon.ico",
  "/web-app-manifest-*.png",
]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS.map((asset) => new Request(asset)))
    })
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name)
          }
          return Promise.resolve()
        })
      )
    })
  )
  self.clients.claim()
})

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url)

  if (url.origin !== self.location.origin) {
    return
  }

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/auth/") ||
    url.pathname.startsWith("/verification") ||
    url.pathname.startsWith("/validation") ||
    url.pathname.startsWith("/inscription") ||
    url.pathname.startsWith("/connexion")
  ) {
    event.respondWith(
      fetch(event.request).then((response) => {
        if (!response || !response.ok) {
          return response
        }
        return response
      }).catch(() => {
        return caches.match(event.request).then((cached) => cached || null)
      })
    )
    return
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        const fetchPromise = fetch(event.request).then((freshResponse) => {
          try {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, freshResponse.clone())
            })
          } catch (e) {
            console.error("SW cache update error:", e)
          }
          return freshResponse
        })
        return cachedResponse || fetchPromise
      }

      return fetch(event.request).then((fetchResponse) => {
        if (!fetchResponse || !fetchResponse.ok) {
          return fetchResponse
        }
        try {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, fetchResponse.clone())
          })
        } catch (e) {
          console.error("SW cache add error:", e)
        }
        return fetchResponse
      })
    })
  )
})