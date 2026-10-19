import { db } from "@/db"
import { publicite } from "@/db/schema"
import { eq, desc, and, lte, or, gt, isNull } from "drizzle-orm"

/**
 * Récupère les publicités affichables pour un slot donné.
 *
 * Règles (alignées sur `getEligiblePublicites` côté client) :
 * - `active`  : affichée tant que `endAt` est absente ou future ;
 * - `scheduled`: affichée seulement si `startAt` est passée (et `endAt` future) ;
 * - `draft` / `expired` / `suspended` : jamais affichées.
 *
 * La borne de fin est vérifiée ici aussi : une campagne dont la date de fin est
 * passée ne doit pas rester visible si le cron de expiration n'a pas tourné.
 */
export async function getPublicitesForSlot(slot: string) {
  const now = new Date()
  try {
    return await db
      .select()
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
      .orderBy(desc(publicite.createdAt))
  } catch (error) {
    // Table may not exist yet (e.g., during build before migrations)
    console.warn(`getPublicitesForSlot(${slot}) failed:`, error)
    return []
  }
}
