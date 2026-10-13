import { db } from "@/db"
import { publicite } from "@/db/schema"
import { eq, desc, gte, and, or } from "drizzle-orm"
/**
 * Récupère les publicités pour un slot donné.
 * - status = "active" : affichées immédiatement
 * - status = "scheduled" : affichées si startAt <= maintenant
 * - status = "draft" : toujours affichables selon contexte
 * - status = "expired" / "suspended" : cachées
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
            and(
              eq(publicite.status, "scheduled"),
              gte(publicite.startAt, now)
            )
          )
        )
      )
      .orderBy(desc(publicite.createdAt))
  } catch (error) {
    // Table may not exist yet (e.g., during build before migrations)
    console.warn(`getPublicitesForSlot(${slot}) failed:`, error)
    return []
  }
}