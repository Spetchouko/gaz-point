import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { disponibilite, pointDeVente, user } from "@/db/schema"
import { eq, count, desc, ilike, or, and } from "drizzle-orm"
import { requireAdmin } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""

    const conditions = []

    if (search) {
      conditions.push(
        or(
          ilike(disponibilite.brand, `%${search}%`),
          ilike(disponibilite.format, `%${search}%`),
          ilike(pointDeVente.name, `%${search}%`)
        )
      )
    }
    if (status) {
      conditions.push(eq(disponibilite.status, status))
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(disponibilite)
      .leftJoin(pointDeVente, eq(disponibilite.pointId, pointDeVente.id))
      .leftJoin(user, eq(disponibilite.vendorId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .catch(() => [{ count: 0 }])

    const total = totalResult.count ?? 0

    const disponibilites = await db
      .select({
        id: disponibilite.id,
        status: disponibilite.status,
        brand: disponibilite.brand,
        format: disponibilite.format,
        quantity: disponibilite.quantity,
        reservedQuantity: disponibilite.reservedQuantity,
        price: disponibilite.price,
        note: disponibilite.note,
        createdAt: disponibilite.createdAt,
        updatedAt: disponibilite.updatedAt,
        expiresAt: disponibilite.expiresAt,
        pointId: disponibilite.pointId,
        vendorId: disponibilite.vendorId,
        pointName: pointDeVente.name,
        pointDistrict: pointDeVente.district,
        vendorName: user.name,
        vendorEmail: user.email,
      })
      .from(disponibilite)
      .leftJoin(pointDeVente, eq(disponibilite.pointId, pointDeVente.id))
      .leftJoin(user, eq(disponibilite.vendorId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(disponibilite.createdAt))
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)

    return NextResponse.json({
      disponibilites,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error("[admin/disponibilites] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disponibilités" },
      { status: 500 }
    )
  }
}
