import { NextResponse } from "next/server"
import { db } from "@/db"
import { avis, user } from "@/db/schema"
import { eq, desc, count, ilike, or, inArray } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"

export async function GET(req: Request) {
  try {
    const staff = await requireModuleApi("avis")
    if (!staff) {
      return NextResponse.json({ error: "Accès réservé à l'administration" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20
    const status = searchParams.get("status") ?? "all"
    const role = searchParams.get("role") ?? "all"
    const search = searchParams.get("search") ?? ""

    // Build where conditions
    const conditions = []
    if (status !== "all") {
      conditions.push(eq(avis.status, status))
    }
    if (role === "client" || role === "vendor") {
      conditions.push(eq(avis.authorRole, role))
    }
    if (search) {
      conditions.push(
        or(
          ilike(avis.authorName, `%${search}%`),
          ilike(avis.quote, `%${search}%`),
          ilike(avis.city, `%${search}%`)
        )
      )
    }

    // Get total count
    const totalResult = await db
      .select({ count: count() })
      .from(avis)
      .where(conditions.length > 0 ? or(...conditions) : undefined)
      .catch(() => [{ count: 0 }])
    const total = totalResult[0]?.count ?? 0

    // Get avis with user info
    const avisList = await db
      .select({
        id: avis.id,
        authorName: avis.authorName,
        authorRole: avis.authorRole,
        authorImage: avis.authorImage,
        city: avis.city,
        quote: avis.quote,
        rating: avis.rating,
        status: avis.status,
        createdAt: avis.createdAt,
        updatedAt: avis.updatedAt,
        userId: avis.userId,
      })
      .from(avis)
      .where(conditions.length > 0 ? or(...conditions) : undefined)
      .orderBy(desc(avis.createdAt))
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)

    return NextResponse.json({
      avis: avisList,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error("[admin/avis] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des avis" },
      { status: 500 }
    )
  }
}