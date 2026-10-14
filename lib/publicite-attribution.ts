import { randomUUID } from "node:crypto"
import { headers } from "next/headers"
import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { db } from "@/db"
import { publicite, publiciteEvent } from "@/db/schema"
import {
  ATTRIBUTION_WINDOW_DAYS,
  isConversionType,
  type ConversionType,
} from "@/lib/publicite-analytics"

/**
 * Attribution publicitaire (dernier clic) — première partie, non personnelle.
 *
 * Au clic sur une bannière, le serveur dépose un cookie first-party contenant
 * uniquement : l'identifiant de la publicité, un identifiant de clic aléatoire
 * et l'horodatage du clic. Aucune donnée personnelle, aucun identifiant
 * utilisateur n'y figure. Le cookie est HttpOnly, SameSite=Lax, 30 jours.
 */
export const AD_ATTRIBUTION_COOKIE = "gz_ad_ref"
const COOKIE_VERSION = "v1"

export type AdAttribution = {
  publiciteId: string
  clickId: string
  clickedAt: number
}

export function newClickId(): string {
  return randomUUID()
}

export function serializeAdAttribution(attribution: AdAttribution): string {
  return [
    COOKIE_VERSION,
    attribution.publiciteId,
    attribution.clickId,
    String(attribution.clickedAt),
  ].join(".")
}

export function parseAdAttribution(value?: string | null): AdAttribution | null {
  if (!value) return null
  const parts = value.split(".")
  if (parts.length !== 4 || parts[0] !== COOKIE_VERSION) return null
  const publiciteId = parts[1]
  const clickId = parts[2]
  const clickedAt = Number(parts[3])
  if (!publiciteId || !clickId || !Number.isFinite(clickedAt) || clickedAt <= 0) {
    return null
  }
  return { publiciteId, clickId, clickedAt }
}

export function isWithinAttributionWindow(clickedAt: number, now = Date.now()): boolean {
  if (!Number.isFinite(clickedAt)) return false
  const age = now - clickedAt
  return age >= 0 && age <= ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60 * 1000
}

export function setAdAttributionCookie(res: NextResponse, attribution: AdAttribution): void {
  res.cookies.set({
    name: AD_ATTRIBUTION_COOKIE,
    value: serializeAdAttribution(attribution),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ATTRIBUTION_WINDOW_DAYS * 24 * 60 * 60,
  })
}

/**
 * Enregistre une conversion attribuée à la publicité cliquée.
 * Idempotent : la clé `conv:<clickId>:<type>` empêche tout double comptage d'une
 * même action pour un même clic. Rien n'est enregistré hors fenêtre
 * d'attribution ou si la publicité n'existe plus.
 */
export async function recordConversion(input: {
  cookieValue?: string | null
  conversionType: ConversionType
  userId?: string | null
  path?: string | null
  now?: number
}): Promise<boolean> {
  if (!isConversionType(input.conversionType)) return false

  const attribution = parseAdAttribution(input.cookieValue)
  if (!attribution) return false
  if (!isWithinAttributionWindow(attribution.clickedAt, input.now ?? Date.now())) {
    return false
  }

  try {
    const [ad] = await db
      .select({ id: publicite.id, slot: publicite.slot })
      .from(publicite)
      .where(eq(publicite.id, attribution.publiciteId))
      .limit(1)
    if (!ad) return false

    await db
      .insert(publiciteEvent)
      .values({
        id: randomUUID(),
        publiciteId: ad.id,
        eventType: "conversion",
        conversionType: input.conversionType,
        slot: ad.slot,
        sourceCategory: null,
        referrerHost: null,
        utmSource: null,
        utmMedium: null,
        utmCampaign: null,
        path: input.path ?? null,
        visitorId: null,
        sessionId: null,
        attributionWindowDays: ATTRIBUTION_WINDOW_DAYS,
        consented: true,
        eventKey: `conv:${attribution.clickId}:${input.conversionType}`,
      })
      .onConflictDoNothing({ target: publiciteEvent.eventKey })

    return true
  } catch (error) {
    console.error("publicite conversion logging failed", error)
    return false
  }
}

/** Variante pour les routes API (lecture directe du cookie de la requête). */
export async function recordConversionFromRequest(
  req: NextRequest,
  conversionType: ConversionType,
  opts?: { userId?: string | null; path?: string | null }
): Promise<boolean> {
  const cookieValue = req.cookies.get(AD_ATTRIBUTION_COOKIE)?.value ?? null
  return recordConversion({
    cookieValue,
    conversionType,
    userId: opts?.userId,
    path: opts?.path ?? new URL(req.url).pathname,
  })
}

/** Variante pour les hooks Better Auth (lecture via next/headers). */
export async function recordConversionFromHeaders(
  conversionType: ConversionType,
  opts?: { userId?: string | null; path?: string | null }
): Promise<boolean> {
  try {
    const headerList = await headers()
    const cookieHeader = headerList.get("cookie") ?? ""
    const match = cookieHeader.match(
      new RegExp(`(?:^|;\\s*)${AD_ATTRIBUTION_COOKIE}=([^;]+)`)
    )
    const cookieValue = match?.[1] ? decodeURIComponent(match[1]) : null
    return recordConversion({
      cookieValue,
      conversionType,
      userId: opts?.userId,
      path: opts?.path,
    })
  } catch (error) {
    console.error("publicite conversion header read failed", error)
    return false
  }
}
