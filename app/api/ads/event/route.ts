import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { publicite, publiciteEvent } from "@/db/schema"
import { auth } from "@/lib/auth"
import {
  ATTRIBUTION_WINDOW_DAYS,
  classifySource,
  isAdEventType,
  referrerHost,
} from "@/lib/publicite-analytics"
import { newClickId, setAdAttributionCookie } from "@/lib/publicite-attribution"

const MAX_FIELD = 300

function clean(value: unknown, max = MAX_FIELD): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Enregistrement d'un événement publicitaire (impression ou clic).
 *
 * - Le consentement explicite est requis (le client ne l'envoie pas sinon).
 * - Les interactions du personnel (admin / collaborateur) sont ignorées.
 * - Unicité par `eventKey` : tout doublon (retry réseau, double rendu) est ignoré.
 * - Au clic, un cookie d'attribution (30 j) est déposé pour relier une future
 *   conversion (inscription, recherche, réservation) à la publicité.
 */
export async function POST(req: NextRequest) {
  let body: Record<string, unknown> | null = null
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    body = null
  }
  if (!body) return new NextResponse("invalid body", { status: 400 })

  const eventType = body.eventType
  if (!isAdEventType(eventType) || eventType === "conversion") {
    return new NextResponse("invalid event type", { status: 400 })
  }

  const publiciteId = clean(body.publiciteId, 100)
  const eventKey = clean(body.eventKey, MAX_FIELD)
  if (!publiciteId || !eventKey) {
    return new NextResponse("missing fields", { status: 400 })
  }

  if (body.consented !== true) {
    return new NextResponse("consent required", { status: 403 })
  }

  // Ne jamais compter les interactions internes d'administration.
  try {
    const session = await auth.api.getSession({ headers: req.headers })
    const role = (session?.user as { role?: string } | undefined)?.role
    if (role === "admin" || role === "collaborateur") {
      return new NextResponse(null, { status: 204 })
    }
  } catch {
    // session illisible : on considère un visiteur anonyme
  }

  const [ad] = await db
    .select({ id: publicite.id, slot: publicite.slot })
    .from(publicite)
    .where(eq(publicite.id, publiciteId))
    .limit(1)
  if (!ad) return new NextResponse(null, { status: 204 })

  const referrer = clean(body.referrer, 500)
  const utmSource = clean(body.utmSource, 150)
  const utmMedium = clean(body.utmMedium, 150)
  const utmCampaign = clean(body.utmCampaign, 150)

  try {
    await db
      .insert(publiciteEvent)
      .values({
        id: randomUUID(),
        publiciteId: ad.id,
        eventType,
        conversionType: null,
        slot: ad.slot,
        sourceCategory: classifySource({ referrer, utmSource, utmMedium, utmCampaign }),
        referrerHost: referrerHost(referrer),
        utmSource,
        utmMedium,
        utmCampaign,
        path: clean(body.path, 300),
        visitorId: clean(body.visitorId, 100),
        sessionId: clean(body.sessionId, 100),
        attributionWindowDays: eventType === "click" ? ATTRIBUTION_WINDOW_DAYS : null,
        consented: true,
        eventKey,
      })
      .onConflictDoNothing({ target: publiciteEvent.eventKey })
  } catch (error) {
    console.error("publicite_event insert failed", error)
    return new NextResponse(null, { status: 204 })
  }

  const res = new NextResponse(null, { status: 204 })
  if (eventType === "click") {
    setAdAttributionCookie(res, {
      publiciteId: ad.id,
      clickId: newClickId(),
      clickedAt: Date.now(),
    })
  }
  return res
}
