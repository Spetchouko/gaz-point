import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { pointDeVente, adminAction } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireModuleApi } from "@/lib/session"

/**
 * PATCH /api/admin/points-de-vente/[id]
 * Modifie les informations d'un point de vente (dépôt) : nom, district, adresse,
 * téléphone, marques, formats, options de service, statut actif.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("vendeurs")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const admin = staff.user

    const { id } = await params
    const body = (await req.json().catch(() => null)) as {
      name?: string
      district?: string
      address?: string
      phone?: string | null
      brands?: string[]
      formats?: string[]
      deliveryEnabled?: boolean
      deliveryFee?: number
      exchangeEnabled?: boolean
      gasSaleEnabled?: boolean
      isActive?: boolean
      vendorId?: string | null
    } | null

    const [existing] = await db
      .select({ id: pointDeVente.id, name: pointDeVente.name, vendorId: pointDeVente.vendorId })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Point de vente introuvable" }, { status: 404 })
    }

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.district !== undefined) updates.district = body.district
    if (body.address !== undefined) updates.address = body.address
    if (body.phone !== undefined) updates.phone = body.phone || null
    if (body.brands !== undefined) updates.brands = body.brands
    if (body.formats !== undefined) updates.formats = body.formats
    if (body.deliveryEnabled !== undefined) updates.deliveryEnabled = body.deliveryEnabled
    if (body.deliveryFee !== undefined) updates.deliveryFee = body.deliveryFee
    if (body.exchangeEnabled !== undefined) updates.exchangeEnabled = body.exchangeEnabled
    if (body.gasSaleEnabled !== undefined) updates.gasSaleEnabled = body.gasSaleEnabled
    if (body.isActive !== undefined) updates.isActive = body.isActive
    if (body.vendorId !== undefined) updates.vendorId = body.vendorId || null
    updates.updatedAt = new Date()

    await db.update(pointDeVente).set(updates).where(eq(pointDeVente.id, id))

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "point",
        targetId: id,
        action: "update",
        details: JSON.stringify({
          name: updates.name,
          district: updates.district,
          isActive: updates.isActive,
        }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Point de vente mis à jour avec succès",
      point: {
        id,
        name: updates.name ?? existing.name,
        vendorId: updates.vendorId ?? existing.vendorId,
        isActive: updates.isActive ?? true,
      },
    })
  } catch (err) {
    console.error("[admin/points-de-vente/[id] PATCH] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la modification du point de vente" },
      { status: 500 }
    )
  }
}
