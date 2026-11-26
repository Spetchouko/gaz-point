import { unstable_cache } from "next/cache"
import { db } from "@/db"
import { publicite } from "@/db/schema"
import { eq, and, lte, or, gt, isNull, asc, desc } from "drizzle-orm"
import { errorMessage } from "@/lib/errors"
import { PUBLICITE_SLOTS } from "@/lib/publicite-config"

/**
 * Tag de cache partagé pour les publicités des deux slots.
 * Utilisé par `unstable_cache` et invalidé via `revalidateTag`.
 */
export const PUBLICITE_CACHE_TAG = "publicite:slots"

/**
 * TTL du cache en secondes (5 min par défaut, configurable via variable d'env).
 * Next.js `unstable_cache` utilise `revalidate` pour le TTL.
 */
export const PUBLICITE_CACHE_TTL = Number(process.env.PUBLICITE_CACHE_TTL ?? 300)

/**
 * Données minimales envoyées au client (pas de données admin sensibles).
 * Champs utilisés par PubliciteCarousel / PubliciteBannerCard.
 */
export type PubliciteBannerData = {
  id: string
  title: string
  description: string | null
  image: string | null
  price: number | null
  priceLabel: string | null
  location: string | null
  phone: string | null
  linkUrl: string | null
  startAt: Date | string | null
  endAt: Date | string | null
  status: string
  duration: number | null
  priority: number
  displayOrder: number
}

/**
 * Récupère les publicités éligibles pour UN slot (version non-cachée, interne).
 * Tri : displayOrder ASC, priority DESC, createdAt DESC.
 */
async function fetchPublicitesForSlot(slot: string): Promise<PubliciteBannerData[]> {
  const now = new Date()
  try {
    const rows = await db
      .select({
        id: publicite.id,
        title: publicite.title,
        description: publicite.description,
        image: publicite.image,
        price: publicite.price,
        priceLabel: publicite.priceLabel,
        location: publicite.location,
        phone: publicite.phone,
        linkUrl: publicite.linkUrl,
        slot: publicite.slot,
        status: publicite.status,
        startAt: publicite.startAt,
        endAt: publicite.endAt,
        duration: publicite.duration,
        priority: publicite.priority,
        displayOrder: publicite.displayOrder,
        createdAt: publicite.createdAt,
      })
      .from(publicite)
      .where(
        and(
          eq(publicite.slot, slot),
          or(
            eq(publicite.status, "active"),
            and(eq(publicite.status, "scheduled"), lte(publicite.startAt, now))
          ),
          or(isNull(publicite.endAt), gt(publicite.endAt, now)),
          or(isNull(publicite.startAt), lte(publicite.startAt, now))
        )
      )
      .orderBy(asc(publicite.displayOrder), desc(publicite.priority), desc(publicite.createdAt))

    return rows as PubliciteBannerData[]
  } catch (error) {
    console.warn(
      `[publicite] fetchPublicitesForSlot(${slot}) impossible : ${errorMessage(error)}`
    )
    return []
  }
}

/**
 * Version cachée (unstable_cache) pour un slot unique.
 * TTL = PUBLICITE_CACHE_TTL (défaut 300s), tag = PUBLICITE_CACHE_TAG.
 */
export const getCachedPublicitesForSlot = unstable_cache(
  fetchPublicitesForSlot,
  ["publicite-slot"],
  {
    revalidate: PUBLICITE_CACHE_TTL,
    tags: [PUBLICITE_CACHE_TAG],
  }
)

/**
 * Récupère les publicités des DEUX slots en une seule requête groupée (non cachée).
 * Utile pour l'invalidation ou les usages serveur qui ont besoin des deux slots.
 */
export async function fetchPublicitesForBothSlots(): Promise<{
  home_hero: PubliciteBannerData[]
  home_search: PubliciteBannerData[]
}> {
  const now = new Date()
  try {
    const rows = await db
      .select({
        id: publicite.id,
        title: publicite.title,
        description: publicite.description,
        image: publicite.image,
        price: publicite.price,
        priceLabel: publicite.priceLabel,
        location: publicite.location,
        phone: publicite.phone,
        linkUrl: publicite.linkUrl,
        slot: publicite.slot,
        status: publicite.status,
        startAt: publicite.startAt,
        endAt: publicite.endAt,
        duration: publicite.duration,
        priority: publicite.priority,
        displayOrder: publicite.displayOrder,
        createdAt: publicite.createdAt,
      })
      .from(publicite)
      .where(
        and(
          or(
            eq(publicite.slot, "home_hero"),
            eq(publicite.slot, "home_search")
          ),
          or(
            eq(publicite.status, "active"),
            and(eq(publicite.status, "scheduled"), lte(publicite.startAt, now))
          ),
          or(isNull(publicite.endAt), gt(publicite.endAt, now)),
          or(isNull(publicite.startAt), lte(publicite.startAt, now))
        )
      )
      .orderBy(asc(publicite.displayOrder), desc(publicite.priority), desc(publicite.createdAt))

    const hero: PubliciteBannerData[] = []
    const search: PubliciteBannerData[] = []
    for (const row of rows) {
      if (row.slot === "home_hero") hero.push(row as PubliciteBannerData)
      else if (row.slot === "home_search") search.push(row as PubliciteBannerData)
    }
    return { home_hero: hero, home_search: search }
  } catch (error) {
    console.warn(
      `[publicite] fetchPublicitesForBothSlots impossible : ${errorMessage(error)}`
    )
    return { home_hero: [], home_search: [] }
  }
}

/**
 * Version cachée de la requête groupée des deux slots.
 * Utilisée par la page d'accueil pour un seul fetch.
 */
export const getCachedPublicitesForBothSlots = unstable_cache(
  fetchPublicitesForBothSlots,
  ["publicite-both-slots"],
  {
    revalidate: PUBLICITE_CACHE_TTL,
    tags: [PUBLICITE_CACHE_TAG],
  }
)

/**
 * Invalide le cache publicités (appelé après CREATE/UPDATE/DELETE/cron).
 * Doit être appelé dans un contexte Server Action ou Route Handler.
 */
export async function invalidatePubliciteCache(): Promise<void> {
  const { revalidateTag } = await import("next/cache")
  revalidateTag(PUBLICITE_CACHE_TAG)
}

/**
 * Fonction de compatibilité : ancien `getPublicitesForSlot` (non cachée).
 * @deprecated Utiliser `getCachedPublicitesForSlot` côté serveur.
 */
export async function getPublicitesForSlot(slot: string): Promise<PubliciteBannerData[]> {
  return fetchPublicitesForSlot(slot)
}