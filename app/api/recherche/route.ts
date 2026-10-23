import { NextRequest, NextResponse } from "next/server"
import { and, desc, ilike, inArray, or } from "drizzle-orm"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { effectiveStatus, isStale } from "@/lib/gaz"
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
    })
    .from(pointDeVente)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .limit(50)

  if (points.length === 0) {
    return NextResponse.json({ results: [] })
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
          (!brand || (item.brand ?? "").toLowerCase() === brand.toLowerCase()) &&
          (!format || (item.format ?? "").toLowerCase() === format.toLowerCase())
      ) ?? null

    const matchesBrand =
      !brand ||
      (report?.brand ?? "").toLowerCase() === brand.toLowerCase() ||
      (point.brands?.some((b) => b.toLowerCase() === brand.toLowerCase()) ?? false)
    const matchesFormat =
      !format ||
      (report?.format ?? "").toLowerCase() === format.toLowerCase() ||
      (point.formats?.some((f) => f.toLowerCase() === format.toLowerCase()) ?? false)

    if (!matchesBrand || !matchesFormat) continue

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
    })
  }

  // Attribution publicitaire : première recherche après un clic (fenêtre 30 j).
  // Idempotent : une seule conversion « recherche » par clic.
  if (request.cookies.get(AD_ATTRIBUTION_COOKIE)) {
    await recordConversionFromRequest(request, "search", { userId: currentUser.id })
  }

  return NextResponse.json({ results })
}
