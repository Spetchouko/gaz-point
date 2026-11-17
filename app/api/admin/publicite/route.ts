import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { publicite, adminAction } from "@/db/schema"
import { eq, count, desc, ilike, or, and } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"
import {
  PUBLICITE_STATUSES,
  PUBLICITE_SLOT_VALUES,
  validatePubliciteTitle,
  validatePubliciteDescription,
  validatePubliciteImage,
  isPubliciteSlot,
} from "@/lib/publicite-config"

export type PubliciteItem = {
  id: string
  title: string
  description: string | null
  image: string | null
  price: number | null
  priceLabel: string | null
  location: string | null
  phone: string | null
  linkUrl: string | null
  slot: string
  status: string
  startAt: string | null
  endAt: string | null
  createdAt: string
  updatedAt: string
}

/**
 * GET /api/admin/publicite
 * Liste les annonces avec filtres (statut, emplacement, recherche).
 */
export async function GET(req: NextRequest) {
  try {
    const staff = await requireModuleApi("publicite")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") ?? "1", 10) || 1
    const pageSize = parseInt(searchParams.get("pageSize") ?? "20", 10) || 20
    const search = searchParams.get("search") ?? ""
    const status = searchParams.get("status") ?? ""
    const slot = searchParams.get("slot") ?? ""

    const conditions = []

    if (search) {
      conditions.push(
        or(ilike(publicite.title, `%${search}%`), ilike(publicite.description, `%${search}%`))
      )
    }
    if (status && PUBLICITE_STATUSES.includes(status as any)) {
      conditions.push(eq(publicite.status, status))
    }
    if (slot && isPubliciteSlot(slot)) {
      conditions.push(eq(publicite.slot, slot))
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(publicite)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .catch(() => [{ count: 0 }])

    const total = totalResult.count ?? 0

    const items = await db
      .select({
        id: publicite.id,
        title: publicite.title,
        description: publicite.description,
        image: publicite.image,
        price: publicite.price,
        priceLabel: publicite.priceLabel,
        location: publicite.location,
        phone: publicite.phone,
        linkUrl: publicite.linkUrl,
        slot: publicite.slot,
        status: publicite.status,
        startAt: publicite.startAt,
        endAt: publicite.endAt,
        createdAt: publicite.createdAt,
        updatedAt: publicite.updatedAt,
      })
      .from(publicite)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(publicite.createdAt))
      .limit(Math.max(pageSize, 1))
      .offset((page - 1) * pageSize)

    return NextResponse.json({
      publicites: items,
      pagination: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) },
    })
  } catch (err) {
    console.error("[admin/publicite GET] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des annonces" },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/publicite
 * Crée une annonce publicitaire (image data-URL, lien, emplacement, dates, statut).
 */
export async function POST(req: NextRequest) {
  try {
    const staff = await requireModuleApi("publicite")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const admin = staff.user

    const body = (await req.json().catch(() => null)) as {
      title?: string
      description?: string | null
      image?: string | null
      price?: number | null
      priceLabel?: string | null
      location?: string | null
      phone?: string | null
      linkUrl?: string | null
      slot?: string
      status?: string
      startAt?: string | null
      endAt?: string | null
    } | null

    if (!body?.title) {
      return NextResponse.json({ error: "Le titre est requis" }, { status: 400 })
    }

    const titleError = validatePubliciteTitle(body.title)
    if (titleError) {
      return NextResponse.json({ error: titleError }, { status: 400 })
    }

    if (body.description !== undefined) {
      const descError = validatePubliciteDescription(body.description)
      if (descError) {
        return NextResponse.json({ error: descError }, { status: 400 })
      }
    }

    if (body.image !== undefined) {
      const imgValidation = validatePubliciteImage(body.image)
      if (!imgValidation.ok) {
        return NextResponse.json({ error: imgValidation.error }, { status: 400 })
      }
    }

    if (body.linkUrl && !/^https?:\/\//i.test(body.linkUrl)) {
      return NextResponse.json(
        { error: "L'URL de destination doit commencer par http:// ou https://" },
        { status: 400 }
      )
    }

    const slot = body.slot && isPubliciteSlot(body.slot) ? body.slot : "home_hero"

    // Déduire le statut effectif si non fourni
    let status = body.status
    if (!status || !PUBLICITE_STATUSES.includes(status as any)) {
      const now = new Date()
      const startMs = body.startAt ? new Date(body.startAt).getTime() : 0
      const endMs = body.endAt ? new Date(body.endAt).getTime() : 0
      const nowMs = now.getTime()
      if (startMs > nowMs) status = "scheduled"
      else if (endMs > 0 && endMs <= nowMs) status = "expired"
      else status = "active"
    }

    const id = crypto.randomUUID()

    await db.insert(publicite).values({
      id,
      title: body.title,
      description: body.description ?? null,
      image: body.image ?? null,
      price: body.price ?? null,
      priceLabel: body.priceLabel ?? null,
      location: body.location ?? null,
      phone: body.phone ?? null,
      linkUrl: body.linkUrl ?? null,
      slot,
      status,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    })

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "publicite",
        targetId: id,
        action: "create",
        details: JSON.stringify({ title: body.title, slot, status }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Annonce créée avec succès",
      publicite: { id, title: body.title, slot, status },
    })
  } catch (err) {
    console.error("[admin/publicite POST] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la création de l'annonce" },
      { status: 500 }
    )
  }
}
