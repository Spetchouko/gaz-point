import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { publicite } from "@/db/schema"
import { and, eq, lte, lt, isNotNull } from "drizzle-orm"

/**
 * Tâche planifiée : active les campagnes programmées arrivées à échéance et
 * expire celles dont la date de fin est passée.
 *
 * Protection : l'endpoint est public par nature (appelé par un cron), il exige
 * donc un secret partagé. Sans `CRON_SECRET` configuré, l'accès est refusé
 * plutôt que laissé ouvert : n'importe qui pourrait sinon manipuler l'état des
 * campagnes publicitaires.
 */
function isAuthorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const header = req.headers.get("authorization")
  if (header === `Bearer ${secret}`) return true

  // Certains planificateurs ne permettent qu'une URL.
  return req.nextUrl.searchParams.get("secret") === secret
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, message: "Non autorisé" }, { status: 401 })
  }

  try {
    const now = new Date()

    const activated = await db
      .update(publicite)
      .set({ status: "active", updatedAt: new Date() })
      .where(
        and(
          eq(publicite.status, "scheduled"),
          isNotNull(publicite.startAt),
          lte(publicite.startAt, now)
        )
      )
      .returning({ id: publicite.id })

    const expired = await db
      .update(publicite)
      .set({ status: "expired", updatedAt: new Date() })
      .where(
        and(
          eq(publicite.status, "active"),
          isNotNull(publicite.endAt),
          lt(publicite.endAt, now)
        )
      )
      .returning({ id: publicite.id })

    return NextResponse.json({
      ok: true,
      activated: activated.length,
      expired: expired.length,
      message: `Campagnes traitées : ${activated.length} activées, ${expired.length} expirées`,
    })
  } catch (error) {
    console.error("Erreur dans le schedule marketing cron:", error)
    return NextResponse.json(
      { ok: false, message: "Erreur lors du traitement du scheduling" },
      { status: 500 }
    )
  }
}
