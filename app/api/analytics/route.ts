import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { db } from "@/db"
import { trafficEvent } from "@/db/schema"

const MAX_STR_LENGTH = 500

function clean(value: unknown, max = MAX_STR_LENGTH): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim().slice(0, max)
  return trimmed.length > 0 ? trimmed : null
}

function cleanInt(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value
  if (typeof value === "string") {
    const parsed = parseInt(value, 10)
    return Number.isFinite(parsed) ? parsed : null
  }
  return null
}

// Types d'événements autorisés (first-party analytics, aucune donnée sensible)
const ALLOWED_EVENT_TYPES = new Set([
  "page_view",
  "pageview",
  "session_start",
  "search_performed",
  "search_results_viewed",
  "signup_started",
  "signup_completed",
  "email_verified",
  "seller_signup_completed",
  "sales_point_created",
  "availability_published",
])

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | {
          eventType?: string
          path?: string
          referrer?: string
          utmSource?: string
          utmMedium?: string
          utmCampaign?: string
          userId?: string
          sessionId?: string
          consented?: boolean
          userAgent?: string
          screenWidth?: number
          screenHeight?: number
          viewportWidth?: number
          viewportHeight?: number
          metadata?: Record<string, unknown>
        }
      | null
    if (!body) return new NextResponse("invalid body", { status: 400 })

    const eventType = clean(body.eventType, 100)
    if (!eventType || !ALLOWED_EVENT_TYPES.has(eventType)) {
      return new NextResponse("invalid or disallowed event type", { status: 400 })
    }

    let path = clean(body.path)
    if (path && (!path.startsWith("/") || path.includes("://"))) {
      return new NextResponse("invalid path", { status: 400 })
    }
    if (path) path = path.split("?")[0]
    // Ne pas journaliser les appels techniques internes
    if (path?.startsWith("/api/") || path?.startsWith("/_next/")) {
      return new NextResponse(null, { status: 204 })
    }

    const sessionId = clean(body.sessionId, 100) || randomUUID()

    // Ne jamais stocker d'ID utilisateur si ce n'est pas une chaîne valide
    const userId = clean(body.userId, 100) ?? null

    const metadata = body.metadata
      ? JSON.stringify(body.metadata)
      : null

    await db.insert(trafficEvent).values({
      id: randomUUID(),
      eventType,
      path: path ?? null,
      referrer: clean(body.referrer),
      utmSource: clean(body.utmSource, 100),
      utmMedium: clean(body.utmMedium, 100),
      utmCampaign: clean(body.utmCampaign, 100),
      userId,
      sessionId,
      consented: !!body.consented,
      metadata,
      userAgent: clean(body.userAgent, 500),
      screenWidth: cleanInt(body.screenWidth),
      screenHeight: cleanInt(body.screenHeight),
      viewportWidth: cleanInt(body.viewportWidth),
      viewportHeight: cleanInt(body.viewportHeight),
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("analytics event logging failed", error)
    return new NextResponse(null, { status: 204 })
  }
}
