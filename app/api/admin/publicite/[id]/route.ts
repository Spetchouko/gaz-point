import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { publicite, adminAction } from "@/db/schema"
import { eq, count } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"
import {
  PUBLICITE_STATUSES,
  isPubliciteSlot,
  validatePubliciteTitle,
  validatePubliciteDescription,
  validatePubliciteImage,
  validatePubliciteDuration,
  validatePublicitePriority,
  validatePubliciteDisplayOrder,
} from "@/lib/publicite-config"
import { invalidatePubliciteCache } from "@/lib/publicite"

/**
 * PATCH /api/admin/publicite/[id]
 * Modifie une annonce publicitaire.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("publicite")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const admin = staff.user

    const { id } = await params

    const [existing] = await db
      .select({
        id: publicite.id,
        title: publicite.title,
        status: publicite.status,
        mode: publicite.mode,
      })
      .from(publicite)
      .where(eq(publicite.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 })
    }

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

    const existingMode = (existing as any).mode === "full_banner" ? "full_banner" : "composed"
    const mode = body.mode === "full_banner" ? "full_banner" : existingMode

    // Validation selon le mode
    if (mode === "full_banner") {
      if (body.campaignName !== undefined) {
        if (!body.campaignName) {
          return NextResponse.json({ error: "Le nom de la campagne est requis" }, { status: 400 })
        }
        if (body.campaignName.length > 60) {
          return NextResponse.json({ error: "Le nom de la campagne ne doit pas dépasser 60 caractères" }, { status: 400 })
        }
      }
    } else {
      if (body.title !== undefined) {
        const titleError = validatePubliciteTitle(body.title)
        if (titleError) {
          return NextResponse.json({ error: titleError }, { status: 400 })
        }
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

    if (body.linkUrl !== undefined && body.linkUrl && !/^https?:\/\//i.test(body.linkUrl)) {
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
    if (body.mode === "composed" || existingMode === "composed") {
      if (body.textAlign && !["left", "center", "right"].includes(body.textAlign)) {
        return NextResponse.json({ error: "Alignement de texte invalide" }, { status: 400 })
      }
      if (body.imageFit && !["cover", "contain"].includes(body.imageFit)) {
        return NextResponse.json({ error: "Ajustement d'image invalide" }, { status: 400 })
      }
    }

    const slot = body.slot !== undefined && isPubliciteSlot(body.slot) ? body.slot : existing.slot

    const updates: Record<string, unknown> = {}
    if (mode === "full_banner" && body.campaignName !== undefined) updates.title = body.campaignName
    if (mode === "composed" && body.title !== undefined) updates.title = body.title
    if (body.description !== undefined) updates.description = body.description
    if (body.image !== undefined) updates.image = body.image
    if (body.price !== undefined) updates.price = body.price
    if (body.priceLabel !== undefined) updates.priceLabel = body.priceLabel
    if (body.location !== undefined) updates.location = body.location
    if (body.phone !== undefined) updates.phone = body.phone
    if (body.linkUrl !== undefined) updates.linkUrl = body.linkUrl || null
    if (body.slot !== undefined) updates.slot = slot
    if (body.status !== undefined && PUBLICITE_STATUSES.includes(body.status as any)) {
      updates.status = body.status
    }
    if (body.startAt !== undefined) updates.startAt = body.startAt ? new Date(body.startAt) : null
    if (body.endAt !== undefined) updates.endAt = body.endAt ? new Date(body.endAt) : null
    if (body.duration !== undefined) updates.duration = body.duration
    if (body.priority !== undefined) updates.priority = body.priority
    if (body.displayOrder !== undefined) updates.displayOrder = body.displayOrder
    if (body.mode !== undefined) updates.mode = body.mode
    // Champs mode composed
    if (body.textAlign !== undefined) updates.textAlign = body.textAlign
    if (body.textColor !== undefined) updates.textColor = body.textColor
    if (body.backgroundOverlay !== undefined) updates.backgroundOverlay = body.backgroundOverlay
    if (body.imageFit !== undefined) updates.imageFit = body.imageFit
    if (body.titlePosition !== undefined) updates.titlePosition = body.titlePosition
    if (body.descriptionPosition !== undefined) updates.descriptionPosition = body.descriptionPosition
    updates.updatedAt = new Date()

    await db.update(publicite).set(updates).where(eq(publicite.id, id))

    // Invalider le cache publicités
    await invalidatePubliciteCache()

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "publicite",
        targetId: id,
        action: "update",
        details: JSON.stringify({
          title: updates.title,
          slot: updates.slot,
          status: updates.status,
        }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Annonce mise à jour avec succès",
      publicite: {
        id,
        title: updates.title ?? existing.title,
        slot: updates.slot ?? existing.slot,
        status: updates.status ?? existing.status,
      },
    })
  } catch (err) {
    console.error("[admin/publicite/[id] PATCH] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'annonce" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/publicite/[id]
 * Supprime une annonce publicitaire.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("publicite")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const admin = staff.user

    const { id } = await params

    const [existing] = await db
      .select({ id: publicite.id, title: publicite.title })
      .from(publicite)
      .where(eq(publicite.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Annonce introuvable" }, { status: 404 })
    }

    await db.delete(publicite).where(eq(publicite.id, id))

    // Invalider le cache publicités
    await invalidatePubliciteCache()

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "publicite",
        targetId: id,
        action: "delete",
        details: JSON.stringify({ title: existing.title }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Annonce supprimée avec succès",
    })
  } catch (err) {
    console.error("[admin/publicite/[id] DELETE] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'annonce" },
      { status: 500 }
    )
  }
}
