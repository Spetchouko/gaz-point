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
  validatePubliciteDuration,
  validatePublicitePriority,
  validatePubliciteDisplayOrder,
  isPubliciteSlot,
} from "@/lib/publicite-config"
import { invalidatePubliciteCache } from "@/lib/publicite"

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
  duration: number | null
  priority: number
  displayOrder: number
  mode: "composed" | "full_banner"
  textAlign: "left" | "center" | "right" | null
  textColor: string | null
  backgroundOverlay: string | null
  imageFit: "cover" | "contain" | null
  titlePosition: string | null
  descriptionPosition: string | null
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
        duration: publicite.duration,
        priority: publicite.priority,
        displayOrder: publicite.displayOrder,
        mode: publicite.mode,
        textAlign: publicite.textAlign,
        textColor: publicite.textColor,
        backgroundOverlay: publicite.backgroundOverlay,
        imageFit: publicite.imageFit,
        titlePosition: publicite.titlePosition,
        descriptionPosition: publicite.descriptionPosition,
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
      duration?: number | null
      priority?: number | null
      displayOrder?: number | null
      mode?: "composed" | "full_banner"
      // Champs pour mode "composed"
      textAlign?: "left" | "center" | "right"
      textColor?: string
      backgroundOverlay?: string
      imageFit?: "cover" | "contain"
      titlePosition?: string
      descriptionPosition?: string
      // Pour mode "full_banner" : campaignName au lieu de title
      campaignName?: string
    } | null

    const mode = body.mode === "full_banner" ? "full_banner" : "composed"

    // Validation selon le mode
    if (mode === "full_banner") {
      if (!body?.campaignName) {
        return NextResponse.json({ error: "Le nom de la campagne est requis" }, { status: 400 })
      }
      if (body.campaignName.length > 60) {
        return NextResponse.json({ error: "Le nom de la campagne ne doit pas dépasser 60 caractères" }, { status: 400 })
      }
    } else {
      if (!body?.title) {
        return NextResponse.json({ error: "Le titre est requis" }, { status: 400 })
      }
      const titleError = validatePubliciteTitle(body.title)
      if (titleError) {
        return NextResponse.json({ error: titleError }, { status: 400 })
      }
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

    const durationError = validatePubliciteDuration(body.duration)
    if (durationError) {
      return NextResponse.json({ error: durationError }, { status: 400 })
    }

    const priorityError = validatePublicitePriority(body.priority)
    if (priorityError) {
      return NextResponse.json({ error: priorityError }, { status: 400 })
    }

    const displayOrderError = validatePubliciteDisplayOrder(body.displayOrder)
    if (displayOrderError) {
      return NextResponse.json({ error: displayOrderError }, { status: 400 })
    }

    // Validation champs mode composed
    if (mode === "composed") {
      if (body.textAlign && !["left", "center", "right"].includes(body.textAlign)) {
        return NextResponse.json({ error: "Alignement de texte invalide" }, { status: 400 })
      }
      if (body.imageFit && !["cover", "contain"].includes(body.imageFit)) {
        return NextResponse.json({ error: "Ajustement d'image invalide" }, { status: 400 })
      }
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

    // Préparer les données selon le mode
    const insertData: Record<string, unknown> = {
      id,
      title: mode === "full_banner" ? body.campaignName : body.title,
      description: mode === "composed" ? (body.description ?? null) : null,
      image: body.image ?? null,
      price: null,
      priceLabel: null,
      location: null,
      phone: null,
      linkUrl: body.linkUrl ?? null,
      slot,
      status,
      startAt: body.startAt ? new Date(body.startAt) : null,
      endAt: body.endAt ? new Date(body.endAt) : null,
      duration: body.duration ?? null,
      priority: body.priority ?? 0,
      displayOrder: body.displayOrder ?? 0,
      mode,
      // Champs mode composed
      textAlign: mode === "composed" ? (body.textAlign ?? "left") : null,
      textColor: mode === "composed" ? (body.textColor ?? "#FFFFFF") : null,
      backgroundOverlay: mode === "composed" ? (body.backgroundOverlay ?? "rgba(0,0,0,0.3)") : null,
      imageFit: mode === "composed" ? (body.imageFit ?? "cover") : null,
      titlePosition: mode === "composed" ? (body.titlePosition ?? "top-left") : null,
      descriptionPosition: mode === "composed" ? (body.descriptionPosition ?? "bottom-left") : null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(publicite).values(insertData)

    // Invalider le cache publicités
    await invalidatePubliciteCache()

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
