import { NextRequest, NextResponse } from "next/server"
import { and, desc, ilike, inArray, or } from "drizzle-orm"
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

export async function GET(request: NextRequest) {
  // La recherche est réservée aux comptes : le garde est appliqué côté serveur,
  // pas seulement dans l'interface.
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
      // L'historique ne doit pas faire échouer une recherche valide.
      console.error("[GET /api/recherche] Search history error:", error)
    }
  }

  // Chaque recherche interroge réellement la base de données. Aucun court-circuit
  // par le cache : on évite ainsi de renvoyer des disponibilités périmées.
  const conditions = []

  if (zone) {
    conditions.push(
      or(
        ilike(pointDeVente.district, `%${zone}%`),
        ilike(pointDeVente.address, `%${zone}%`),
        ilike(pointDeVente.name, `%${zone}%`)
      )
    )
  }

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
      // Les colonnes GPS (latitude/longitude) ne sont pas encore migrées dans
      // Neon (migration 0011 non appliquée) : elles ne sont pas sélectionnées,
      // sinon toute la requête échouerait (et la recherche avec).
    })
    .from(pointDeVente)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(50)

  if (points.length === 0) {
    await recordSearchHistory(0)
    return NextResponse.json({ results: [], count: 0, disponibiliteIds: [] })
  }

  // Une seule requête pour tous les points (au lieu d'une requête par point).
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
    .where(inArray(disponibilite.pointId, points.map((p) => p.id)))
    .orderBy(desc(disponibilite.createdAt))

  // Regroupe par point, en conservant l'ordre décroissant (le plus récent d'abord).
  const reportsByPoint = new Map<string, typeof reports>()
  for (const report of reports) {
    const list = reportsByPoint.get(report.pointId) ?? []
    list.push(report)
    reportsByPoint.set(report.pointId, list)
  }

  const now = new Date()
  const results = []

  for (const point of points) {
    const pointReports = reportsByPoint.get(point.id) ?? []

    // Le signalement retenu doit correspondre aux filtres demandés. Sans ce
    // filtre, une recherche « 12,5 kg » pouvait afficher la disponibilité
    // d'un autre format.
    const report =
      pointReports.find(
        (item) =>
          gasBrandMatches(item.brand, brand) &&
          (!format || (item.format ?? "").toLowerCase() === format.toLowerCase())
      ) ?? null

    // Pas de disponibilité correspondant aux critères de marque/format
    // pour ce point : on ne l'affiche pas (évite les résultats vides/fictifs).
    if (!report) continue

    const expired =
      report?.expiresAt != null && new Date(report.expiresAt).getTime() < now.getTime()

    const status = report
      ? expired
        ? "indisponible"
        : effectiveStatus(report.status, report.createdAt)
      : null

    results.push({
      id: point.id,
      name: point.name,
      district: point.district,
      address: point.address,
      phone: point.phone,
      brands: point.brands,
      formats: point.formats,
      status,
      note: report?.note ?? null,
      quantity: report?.quantity ?? null,
      price: report?.price ?? null,
      format: report?.format ?? null,
      brand: report?.brand ?? null,
      expiresAt: report?.expiresAt ?? null,
      updatedAt: report?.createdAt ?? null,
      updatedBy: report?.reportedByName ?? null,
      source: report?.source ?? null,
      stale: report ? isStale(report.createdAt) : false,
      expired,
      disponibiliteId: report?.id ?? "",
      hasDelivery: Boolean(point.deliveryEnabled || report?.delivery),
      hasExchange: Boolean(point.exchangeEnabled || report?.exchange),
      hasGasSale: Boolean(point.gasSaleEnabled || report?.gasSale),
      deliveryFee: point.deliveryEnabled ? point.deliveryFee : report?.price ?? null,
      // Pas de coordonnées GPS pour le point (colonnes non migrées) : la
      // distance n'est jamais calculée plutôt que d'être inventée.
      distanceKm: null,
    })
  }

  // Lorsque la géolocalisation est disponible, trier par distance croissante
  // (les disponibilités les plus proches en premier). Sans coordonnées des
  // points, toutes les distances sont nulles : le tri n'a aucun effet et on
  // l'évite (comparaisons Infini - Infini).
  const hasDistances = results.some((result) => result.distanceKm != null)
  if (hasGeolocation && hasDistances) {
    results.sort((a, b) => {
      const da = a.distanceKm ?? Infinity
      const db_ = b.distanceKm ?? Infinity
      return da - db_
    })
  }

  // Attribution publicitaire : première recherche après un clic (fenêtre 30 j).
  // Idempotent : une seule conversion « recherche » par clic.
  if (request.cookies.get(AD_ATTRIBUTION_COOKIE)) {
    await recordConversionFromRequest(request, "search", { userId: currentUser.id })
  }

  await recordSearchHistory(results.length)

  return NextResponse.json({
    results,
    count: results.length,
    disponibiliteIds: results
      .map((result) => result.disponibiliteId)
      .filter((id): id is string => Boolean(id)),
  })
}
