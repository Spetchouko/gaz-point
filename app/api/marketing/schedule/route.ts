import { db } from "@/db"
import { publicite } from "@/db/schema"
import { eq, gte, and, lt, sql } from "drizzle-orm"

export async function GET() {
  try {
    const now = new Date()
    const doualaTimezone = "Africa/Douala"
    const doualaTime = new Intl.DateTimeFormat("en-CA", {
      timeZone: doualaTimezone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    })
      .format(now)
      .replace(",", "")
    // Apply Cameroon timezone offset (1 hour) to align with actions.ts
    const nowAdjusted = new Date(now.getTime() - 3600000)

    // Trouver les campagnes programmées dont l'heure de début est écoulée
    const toActivate = await db
      .select()
      .from(publicite)
      .where(
        and(
          eq(publicite.status, "scheduled"),
          gte(publicite.startAt, nowAdjusted)
        )
      )

    // Trouver les campagnes actives dont la date de fin est écoulée
    const toExpire = await db
      .select()
      .from(publicite)
      .where(
        and(
          eq(publicite.status, "active"),
          lt(publicite.endAt, nowAdjusted)
        )
      )

    // Mettre à jour les campagnes à expirer
    const expiryUpdates = await Promise.all(
      toExpire.map((ad) =>
        db
          .update(publicite)
          .set({ status: "expired" })
          .where(eq(publicite.id, ad.id))
      )
    )

    // Trouver les campagnes à activer (startAt <= now mais status = scheduled)
    const toActivate2 = await db
      .select()
      .from(publicite)
      .where(
        and(
          eq(publicite.status, "scheduled"),
          sql`${publicite.startAt} <= ${now}`
        )
      )

    const activationUpdates = await Promise.all(
      toActivate2.map((ad) =>
        db
          .update(publicite)
          .set({ status: "active" })
          .where(eq(publicite.id, ad.id))
      )
    )

    // Journaliser les actions

    return Response.json({
      ok: true,
      doualaTime,
      activated: activationUpdates.length,
      expired: expiryUpdates.length,
      message: `Campagnes traitées: ${activationUpdates.length} activées, ${expiryUpdates.length} expirées`,
    })
  } catch (error) {
    console.error("Erreur dans le schedule marketing cron:", error)
    return Response.json(
      { ok: false, message: "Erreur lors du traitement du scheduling" },
      { status: 500 }
    )
  }
}