import { NextRequest, NextResponse } from "next/server"
import { and, desc, ilike, inArray, or, eq, sql, count } from "drizzle-orm"
import { randomUUID } from "node:crypto"
import { db } from "@/db"
import { disponibilite, pointDeVente, trafficEvent } from "@/db/schema"
import { effectiveStatus, isStale } from "@/lib/gaz"
import { gasBrandMatches } from "@/lib/gas-brands"
import { getCurrentUser } from "@/lib/session"
import {
  AD_ATTRIBUTION_COOKIE,
  recordConversionFromRequest,
} from "@/lib/publicite-attribution"
import { serverCache, cacheKeys } from "@/lib/server-cache"

export async function GET(request: NextRequest) {
  const currentUser = await getCurrentUser()
  if (!currentUser) {
    return NextResponse.json({ error: "Authentification requise" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const brand = searchParams.get("brand")?.trim() || null
  const format = searchParams.get("format")?.trim() || null
  const zone = searchParams.get("zone")?.trim() || null
  const latParam = searchParams.get("lat")
  const lngParam = searchParams.get("lng")
  const userLat = latParam ? Number(latParam) : null
  const userLng = lngParam ? Number(lngParam) : null
  const hasGeolocation = userLat != null && userLng != null && !Number.isNaN(userLat) && !Number.isNaN(userLng)

  // Pagination params
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10))
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(searchParams.get("pageSize") ?? "20", 10)))
  const offset = (page - 1) * pageSize

  const shouldRecordHistory = searchParams.get("history") === "1"

  const recordSearchHistory = async (resultsCount: number) => {
    if (!shouldRecordHistory) return
    try {
      await db.insert(trafficEvent).values({
        id: randomUUID(),
        eventType: "search",
        path: "/dashboard/recherches",
        userId: currentUser.id,
        consented: false,
        metadata: {
          brand: brand?.slice(0, 100) ?? null,
          format: format?.slice(0, 50) ?? null,
          zone: zone?.slice(0, 200) ?? null,
          resultsCount,
        },
      })
    } catch (error) {
      console.error("[GET /api/recherche] Search history error:", error)
    }
  }

  // Build cache key from search criteria
  const cacheKey = cacheKeys.search({ brand, format, zone, lat: userLat, lng: userLng, page, pageSize })

  // Try cache (short TTL for availability data)
  const cached = serverCache.get<any>(cacheKey)
  if (cached) {
    // Still record history for analytics
    await recordSearchHistory(cached.totalCount)
    return NextResponse.json({ ...cached, cached: true })
  }

  // Build conditions for pointDeVente query
  const pointConditions = []
  if (zone) {
    pointConditions.push(
      or(
        ilike(pointDeVente.district, `%${zone}%`),
        ilike(pointDeVente.address, `%${zone}%`),
        ilike(pointDeVente.name, `%${zone}%`)
      )
    )
  }

  // Fetch points with pagination
  const points = await db
    .select({
      id: pointDeVente.id,
      name: pointDeVente.name,
      district: pointDeVente.district,
      address: pointDeVente.address,
      phone: pointDeVente.phone,
      brands: pointDeVente.brands,
      formats: pointDeVente.formats,
      deliveryEnabled: pointDeVente.deliveryEnabled,
      deliveryFee: pointDeVente.deliveryFee,
      exchangeEnabled: pointDeVente.exchangeEnabled,
      gasSaleEnabled: pointDeVente.gasSaleEnabled,
    })
    .from(pointDeVente)
    .where(pointConditions.length > 0 ? and(...pointConditions) : undefined)
    .limit(50) // Reasonable limit for points

  if (points.length === 0) {
    await recordSearchHistory(0)
    return NextResponse.json({ results: [], count: 0, totalCount: 0, page, pageSize, totalPages: 0, disponibiliteIds: [] })
  }

  const pointIds = points.map((p) => p.id)
  const pointById = new Map(points.map((p) => [p.id, p]))

  // Build conditions for disponibilite query
  const dispoConditions = [inArray(disponibilite.pointId, pointIds)]

  // Push brand filter to SQL if possible (exact match on normalized brand)
  if (brand) {
    // Use ILIKE for case-insensitive brand matching
    dispoConditions.push(ilike(disponibilite.brand, `%${brand}%`))
  }

  // Push format filter to SQL
  if (format) {
    dispoConditions.push(eq(disponibilite.format, format))
  }

  // Only fetch non-expired by default (status disponible or a_confirmer)
  // Expired filtering done in JS for accuracy with expiresAt

  // Get total count for pagination (without offset/limit)
  const totalCountResult = await db
    .select({ count: count() })
    .from(disponibilite)
    .where(and(...dispoConditions))
  const totalCount = Number(totalCountResult[0]?.count ?? 0)

  // Fetch paginated results
  const reports = await db
    .select({
      id: disponibilite.id,
      pointId: disponibilite.pointId,
      status: disponibilite.status,
      note: disponibilite.note,
      quantity: disponibilite.quantity,
      price: disponibilite.price,
      format: disponibilite.format,
      brand: disponibilite.brand,
      expiresAt: disponibilite.expiresAt,
      createdAt: disponibilite.createdAt,
      reportedByName: disponibilite.reportedByName,
      source: disponibilite.source,
      delivery: disponibilite.delivery,
      exchange: disponibilite.exchange,
      gasSale: disponibilite.gasSale,
    })
    .from(disponibilite)
    .where(and(...dispoConditions))
    .orderBy(desc(disponibilite.createdAt))
    .limit(pageSize)
    .offset(offset)

  const now = new Date()
  const results = []

  for (const report of reports) {
    const point = pointById.get(report.pointId)
    if (!point) continue

    // Additional brand filtering in JS for gasBrandMatches logic (fuzzy matching)
    if (brand && !gasBrandMatches(report.brand, brand)) continue

    // Additional format filtering in JS (case-insensitive)
    if (format && (report.format ?? "").toLowerCase() !== format.toLowerCase()) continue

    const expired = report.expiresAt != null && new Date(report.expiresAt).getTime() < now.getTime()

    const status = expired
      ? "indisponible"
      : effectiveStatus(report.status, report.createdAt)

    results.push({
      id: report.id,
      name: point.name,
      district: point.district,
      address: point.address,
      phone: point.phone,
      brands: point.brands,
      formats: point.formats,
      status,
      note: report.note ?? null,
      quantity: report.quantity ?? null,
      price: report.price ?? null,
      format: report.format ?? null,
      brand: report.brand ?? null,
      expiresAt: report.expiresAt ?? null,
      updatedAt: report.createdAt ?? null,
      updatedBy: report.reportedByName ?? null,
      source: report.source ?? null,
      stale: isStale(report.createdAt),
      expired,
      disponibiliteId: report.id,
      hasDelivery: Boolean(point.deliveryEnabled || report.delivery),
      hasExchange: Boolean(point.exchangeEnabled || report.exchange),
      hasGasSale: Boolean(point.gasSaleEnabled || report.gasSale),
      deliveryFee: point.deliveryEnabled ? point.deliveryFee : report.price ?? null,
      distanceKm: null,
    })
  }

  // Sort by distance if geolocation available (currently all null, placeholder for future)
  const hasDistances = results.some((r) => r.distanceKm != null)
  if (hasGeolocation && hasDistances) {
    results.sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
  }

  if (request.cookies.get(AD_ATTRIBUTION_COOKIE)) {
    await recordConversionFromRequest(request, "search", { userId: currentUser.id })
  }

  await recordSearchHistory(results.length)

  const response = {
    results,
    count: results.length,
    totalCount,
    page,
    pageSize,
    totalPages: Math.ceil(totalCount / pageSize),
    disponibiliteIds: results.map((r) => r.disponibiliteId).filter((id): id is string => Boolean(id)),
  }

  // Cache for 30 seconds (short TTL for availability freshness)
  serverCache.set(cacheKey, response, { ttlMs: 30_000 })

  return NextResponse.json(response)
}