import { unstable_cache } from "next/cache"
import { db } from "@/db"
import { publicite } from "@/db/schema"
import { eq, and, lte, or, gt, isNull, asc, desc } from "drizzle-orm"
import { errorMessage } from "@/lib/errors"
import { PUBLICITE_SLOTS } from "@/lib/publicite-config"
import { withTransientRetry } from "@/lib/transient-retry"

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
  mode: "composed" | "full_banner"
  // Champs pour mode "composed"
  textAlign: "left" | "center" | "right" | null
  textColor: string | null
  backgroundOverlay: string | null
  imageFit: "cover" | "contain" | null
  titlePosition: string | null
  descriptionPosition: string | null
}

/**
 * Récupère les publicités éligibles pour UN slot (version non-cachée, interne).
 * Tri : displayOrder ASC, priority DESC, createdAt DESC.
 */
async function fetchPublicitesForSlot(slot: string): Promise<PubliciteBannerData[]> {
  const now = new Date()
  try {
    const rows = await withTransientRetry(async () => {
      return await db
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
          mode: publicite.mode,
          textAlign: publicite.textAlign,
          textColor: publicite.textColor,
          backgroundOverlay: publicite.backgroundOverlay,
          imageFit: publicite.imageFit,
          titlePosition: publicite.titlePosition,
          descriptionPosition: publicite.descriptionPosition,
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
    })

    // Handle case where db returns null (connection issue)
    if (!rows || !Array.isArray(rows)) {
      console.warn("[publicite] Query returned null/undefined, returning empty array")
      return []
    }

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
 * En développement, si le cache n'est pas disponible, on utilise la version non cachée.
 */
async function getCachedPublicitesForSlotImpl(slot: string) {
  try {
    const cached = unstable_cache(
      fetchPublicitesForSlot,
      ["publicite-slot", slot],
      {
        revalidate: PUBLICITE_CACHE_TTL,
        tags: [PUBLICITE_CACHE_TAG],
      }
    )
    return await cached(slot)
  } catch (error) {
    // Si le cache échoue (ex: "Invariant: incrementalCache missing"), ou si la requête DB échoue,
    // on utilise la version non cachée, qui gère elle-même les erreurs en renvoyant des tableaux vides.
    if (!(error instanceof Error && error.message.includes("incrementalCache"))) {
      console.warn(
        "[publicite] Échec du cache pour slot",
        slot,
        ":", 
        error instanceof Error ? error.message : error
      )
    }
    return fetchPublicitesForSlot(slot)
  }
}

export const getCachedPublicitesForSlot = getCachedPublicitesForSlotImpl

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
    const rows = await withTransientRetry(async () => {
      return await db
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
          mode: publicite.mode,
          textAlign: publicite.textAlign,
          textColor: publicite.textColor,
          backgroundOverlay: publicite.backgroundOverlay,
          imageFit: publicite.imageFit,
          titlePosition: publicite.titlePosition,
          descriptionPosition: publicite.descriptionPosition,
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
    })

    // Handle case where db returns null (connection issue)
    if (!rows || !Array.isArray(rows)) {
      console.warn("[publicite] Query returned null/undefined, returning empty arrays")
      return { home_hero: [], home_search: [] }
    }

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
 * En développement, si le cache n'est pas disponible, on utilise la version non cachée.
 */
async function getCachedPublicitesForBothSlotsImpl() {
  try {
    // unstable_cache peut échouer en développement si incrementalCache n'est pas disponible
    const cached = unstable_cache(
      fetchPublicitesForBothSlots,
      ["publicite-both-slots"],
      {
        revalidate: PUBLICITE_CACHE_TTL,
        tags: [PUBLICITE_CACHE_TAG],
      }
    )
    return await cached()
  } catch (error) {
    // Si le cache échoue (ex: "Invariant: incrementalCache missing"), ou si la requête DB échoue,
    // fallback vers version non cachée qui renvoie des tableaux vides en cas d'erreur.
    if (!(error instanceof Error && error.message.includes("incrementalCache"))) {
      console.warn(
        "[publicite] Échec du cache, utilisation de la requête directe :",
        error instanceof Error ? error.message : error
      )
    }
    return fetchPublicitesForBothSlots()
  }
}

export const getCachedPublicitesForBothSlots = getCachedPublicitesForBothSlotsImpl

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