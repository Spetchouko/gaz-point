import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { pointDeVente, user } from "@/db/schema"
import { eq, count, desc, ilike, or, and } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"

export async function GET(req: NextRequest) {
  try {
    const staff = await requireModuleApi("vendeurs")
    if (!staff) {
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
          ilike(pointDeVente.name, `%${search}%`),
          ilike(pointDeVente.district, `%${search}%`),
          ilike(pointDeVente.address, `%${search}%`),
          ilike(user.name, `%${search}%`)
        )
      )
    }
    if (status === "active") {
      conditions.push(eq(pointDeVente.isActive, true))
    } else if (status === "inactive") {
      conditions.push(eq(pointDeVente.isActive, false))
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(pointDeVente)
      .leftJoin(user, eq(pointDeVente.vendorId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .catch(() => [{ count: 0 }])

    const total = totalResult.count ?? 0

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
        vendorId: pointDeVente.vendorId,
        vendorName: user.name,
        vendorEmail: user.email,
        isActive: pointDeVente.isActive,
        createdAt: pointDeVente.createdAt,
        updatedAt: pointDeVente.updatedAt,
      })
      .from(pointDeVente)
      .leftJoin(user, eq(pointDeVente.vendorId, user.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(pointDeVente.createdAt))
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)

    return NextResponse.json({
      points,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error("[admin/points-de-vente] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des points de vente" },
      { status: 500 }
    )
  }
}
