import { randomUUID } from "node:crypto"
import { NextRequest, NextResponse } from "next/server"
import { and, desc, eq, inArray } from "drizzle-orm"
import { db } from "@/db"
import {
  brand,
  disponibilite,
  pointDeVente,
  pointDeVenteBouteille,
  vendorOnboarding,
} from "@/db/schema"
import { getProUser } from "@/lib/session"
import { normalizeCatalogValue } from "@/lib/vendor-catalog"

export async function GET() {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const points = await db
      .select({ id: pointDeVente.id })
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, user.id))

    const pointIds = points.map((point) => point.id)
    if (pointIds.length === 0) {
      return NextResponse.json({ disponibilites: [] })
    }

    const disponibilites = await db
      .select()
      .from(disponibilite)
      .where(inArray(disponibilite.pointId, pointIds))
      .orderBy(desc(disponibilite.createdAt))

    return NextResponse.json({ disponibilites })
  } catch (err) {
    console.error("[disponibilite/mine] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la récupération des disponibilités" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getProUser()
    if (!auth) {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 401 })
    }
    const { user, role } = auth
    if (role !== "vendor") {
      return NextResponse.json({ error: "Accès réservé aux vendeurs" }, { status: 403 })
    }

    const body = (await req.json().catch(() => null)) as {
      pointId?: string
      brand?: string
      format?: string
      status?: "disponible" | "indisponible"
      quantity?: number
      price?: number
      note?: string
    } | null

    const brandName = body?.brand?.trim()
    const format = body?.format?.trim()
    const status = body?.status ?? "disponible"

    if (!body?.pointId || !brandName || !format) {
      return NextResponse.json(
        { error: "Dépôt, marque et format sont requis" },
        { status: 400 }
      )
    }
    if (brandName.length > 50 || format.length > 30) {
      return NextResponse.json(
        { error: "La marque ou le format est trop long" },
        { status: 400 }
      )
    }
    if (status !== "disponible" && status !== "indisponible") {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 })
    }

    const quantity =
      status === "disponible" ? Number(body.quantity) : body.quantity ?? null
    if (
      status === "disponible" &&
      (!Number.isInteger(quantity) || (quantity as number) < 1)
    ) {
      return NextResponse.json(
        { error: "Une quantité valide est obligatoire" },
        { status: 400 }
      )
    }

    const [point] = await db
      .select({
        id: pointDeVente.id,
        vendorId: pointDeVente.vendorId,
        brands: pointDeVente.brands,
        formats: pointDeVente.formats,
      })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, body.pointId))
      .limit(1)

    if (!point || point.vendorId !== user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const brandKey = normalizeCatalogValue(brandName)
    const formatKey = normalizeCatalogValue(format)
    const brandAllowed = (point.brands ?? []).some(
      (item) => normalizeCatalogValue(item) === brandKey
    )
    const formatAllowed = (point.formats ?? []).some(
      (item) => normalizeCatalogValue(item) === formatKey
    )

    if (!brandAllowed || !formatAllowed) {
      return NextResponse.json(
        {
          error:
            "Cette marque ou ce grammage ne fait pas partie des références déclarées pour votre dépôt.",
        },
        { status: 400 }
      )
    }

    const [existing] = await db
      .select()
      .from(disponibilite)
      .where(
        and(
          eq(disponibilite.pointId, point.id),
          eq(disponibilite.brand, brandName),
          eq(disponibilite.format, format)
        )
      )
      .limit(1)

    const [savedAvailability] = existing
      ? await db
          .update(disponibilite)
          .set({
            status,
            quantity: quantity ?? null,
            note: body.note?.trim() || null,
            vendorId: user.id,
            source: "vendeur",
            reportedBy: user.id,
            reportedByName: user.name ?? "Vendeur",
            updatedAt: new Date(),
          })
          .where(eq(disponibilite.id, existing.id))
          .returning()
      : await db
          .insert(disponibilite)
          .values({
            id: randomUUID(),
            pointId: point.id,
            vendorId: user.id,
            brand: brandName,
            format,
            status,
            quantity: quantity ?? null,
            price: body.price ?? null,
            note: body.note?.trim() || null,
            source: "vendeur",
            reportedBy: user.id,
            reportedByName: user.name ?? "Vendeur",
          })
          .returning()

    // Conserve la référence marque + grammage et la quantité réelle du dépôt.
    const nameKey = brandKey
    const [existingBrand] = await db
      .select({ id: brand.id })
      .from(brand)
      .where(eq(brand.nameKey, nameKey))
      .limit(1)

    const brandId =
      existingBrand?.id ??
      (
        await db
          .insert(brand)
          .values({
            id: randomUUID(),
            name: brandName,
            nameKey,
          })
          .onConflictDoNothing()
          .returning()
      )[0]?.id

    if (brandId) {
      await db
        .insert(pointDeVenteBouteille)
        .values({
          id: randomUUID(),
          pointDeVenteId: point.id,
          brandId,
          format,
          quantity: quantity ?? 0,
        })
        .onConflictDoUpdate({
          target: [
            pointDeVenteBouteille.pointDeVenteId,
            pointDeVenteBouteille.brandId,
            pointDeVenteBouteille.format,
          ],
          set: {
            quantity: quantity ?? 0,
            updatedAt: new Date(),
          },
        })
    }

    const [onboarding] = await db
      .select({
        inventory: vendorOnboarding.inventory,
      })
      .from(vendorOnboarding)
      .where(eq(vendorOnboarding.userId, user.id))
      .limit(1)

    if (onboarding) {
      const inventory = (onboarding.inventory ?? []).filter(
        (entry) =>
          normalizeCatalogValue(entry.brand) !== brandKey ||
          normalizeCatalogValue(entry.format) !== formatKey
      )
      inventory.push({
        brand: brandName,
        format,
        quantity: quantity ?? 0,
      })

      await db
        .update(vendorOnboarding)
        .set({ inventory, updatedAt: new Date() })
        .where(eq(vendorOnboarding.userId, user.id))
    }

    return NextResponse.json(
      { disponibilite: savedAvailability, created: !existing },
      { status: existing ? 200 : 201 }
    )
  } catch (err) {
    console.error("[disponibilite/create] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la création de la disponibilité" },
      { status: 500 }
    )
  }
}
