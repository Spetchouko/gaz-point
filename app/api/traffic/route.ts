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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json().catch(() => null)) as
      | { path?: string; referrer?: string; utmSource?: string; utmMedium?: string; utmCampaign?: string }
      | null
    if (!body) return new NextResponse("invalid body", { status: 400 })

    let path = clean(body.path)
    if (!path || !path.startsWith("/") || path.includes("://")) {
      return new NextResponse("invalid path", { status: 400 })
    }
    path = path.split("?")[0]
    // Ne pas journaliser les appels techniques internes
    if (path.startsWith("/api/") || path.startsWith("/_next/")) {
      return new NextResponse(null, { status: 204 })
    }

    const referrer = clean(body.referrer)
    let referrerHost: string | null = null
    if (referrer) {
      try {
        referrerHost = new URL(referrer).host
      } catch {
        referrerHost = null
      }
    }

    await db.insert(trafficEvent).values({
      id: randomUUID(),
      eventType: "pageview",
      path,
      referrer: referrerHost,
      utmSource: clean(body.utmSource, 100),
      utmMedium: clean(body.utmMedium, 100),
      utmCampaign: clean(body.utmCampaign, 100),
      userId: null,
      consented: true,
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("traffic_event pageview logging failed", error)
    return new NextResponse(null, { status: 204 })
  }
}