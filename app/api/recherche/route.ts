import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, ilike, or } from "drizzle-orm"
import { db } from "@/db"
import { disponibilite, pointDeVente } from "@/db/schema"
import { effectiveStatus, isStale } from "@/lib/gaz"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const brand = searchParams.get("brand")?.trim()
  const format = searchParams.get("format")?.trim()
  const zone = searchParams.get("zone")?.trim()

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

  const results = await Promise.all(
    points.map(async (point) => {
      const [report] = await db
        .select({
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
        .where(eq(disponibilite.pointId, point.id))
        .orderBy(desc(disponibilite.createdAt))
        .limit(1)

      const now = new Date()
      const expired =
        report?.expiresAt != null && new Date(report.expiresAt).getTime() < now.getTime()

      const status = report
        ? expired
          ? "indisponible"
          : effectiveStatus(report.status, report.createdAt)
        : null

      const matchesBrand =
        !brand || (point.brands && point.brands.includes(brand))
      const matchesFormat =
        !format ||
        (report?.format === format) ||
        (point.formats && point.formats.includes(format))

      if (!matchesBrand || !matchesFormat) return null

      return {
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
      }
    })
  )

  const filtered = results.filter(Boolean)

  return NextResponse.json({ results: filtered })
}
