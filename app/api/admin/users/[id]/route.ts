import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import {
  user,
  pointDeVente,
  disponibilite,
  reservation,
  adminAction,
} from "@/db/schema"
import { eq, count, and, or } from "drizzle-orm"
import {
  requireModuleApi,
  canModifyUserRole,
  getCurrentUser,
} from "@/lib/session"

/**
 * PATCH /api/admin/users/[id]
 * Modifie les informations d'un utilisateur : nom, email, téléphone, rôle, isActive.
 * Protégé côté serveur : seul un administrateur peut modifier, et un collaborateur
 * ne peut jamais toucher à un compte administrateur ni rétrograder l'admin principal.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("utilisateurs")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const admin = staff.user

    const { id } = await params
    const body = (await req.json().catch(() => null)) as {
      name?: string
      email?: string
      phoneNumber?: string | null
      role?: string
      isActive?: boolean
    } | null

    const [existing] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    // Empêcher l'admin de se modifier lui-même de façon incohérente (rôle/désactivation)
    if (existing.id === admin.id) {
      if (body.role && body.role !== existing.role) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas changer votre propre rôle" },
          { status: 400 }
        )
      }
      if (body.isActive === false) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas désactiver votre propre compte" },
          { status: 400 }
        )
      }
    }

    // Un collaborateur ne peut pas modifier un compte administrateur
    if (admin.role === "collaborateur" && existing.role === "admin") {
      return NextResponse.json(
        { error: "Un collaborateur ne peut pas modifier un compte administrateur." },
        { status: 403 }
      )
    }

    // Ne jamais rétrograder l'administrateur principal
    if (body.role && body.role !== "admin" && existing.role === "admin") {
      const principal = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.role, "admin"))
        .orderBy(user.createdAt)
        .limit(1)
      if (principal[0]?.id === existing.id) {
        return NextResponse.json(
          { error: "L'administrateur principal ne peut pas être rétrogradé." },
          { status: 403 }
        )
      }
    }

    // Vérifier l'unicité de l'email si modifié
    if (body.email && body.email !== existing.email) {
      const [taken] = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, body.email))
        .limit(1)
      if (taken) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé par un autre compte" },
          { status: 400 }
        )
      }
    }

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.email !== undefined) updates.email = body.email
    if (body.phoneNumber !== undefined) updates.phoneNumber = body.phoneNumber || null
    if (body.role !== undefined) updates.role = body.role
    if (body.isActive !== undefined) updates.isActive = body.isActive
    updates.updatedAt = new Date()

    await db.update(user).set(updates).where(eq(user.id, id))

    // Traçabilité de l'action administrative
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "user",
        targetId: id,
        action: "update",
        details: JSON.stringify({
          name: updates.name,
          email: updates.email,
          phoneNumber: updates.phoneNumber,
          role: updates.role,
          isActive: updates.isActive,
        }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // Ne fait pas échouer la modification si la traçabilité échoue
    }

    return NextResponse.json({
      ok: true,
      message: "Utilisateur mis à jour avec succès",
      user: {
        id: existing.id,
        name: updates.name ?? existing.name,
        email: updates.email ?? existing.email,
        phoneNumber: updates.phoneNumber ?? existing.phoneNumber,
        role: updates.role ?? existing.role,
        isActive: updates.isActive ?? existing.isActive,
      },
    })
  } catch (err) {
    console.error("[admin/users/[id] PATCH] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la modification de l'utilisateur" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/users/[id]
 * Supprime un compte avec protection des données métier associées.
 * Refusé si l'utilisateur a des réservations, points de vente, disponibilités
 * ou recharges liées (on ne supprime pas les données métier).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const staff = await requireModuleApi("utilisateurs")
    if (!staff) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }
    const admin = staff.user

    const { id } = await params

    const [existing] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
    }

    // Empêcher l'auto-suppression
    if (existing.id === admin.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      )
    }

    // Un collaborateur ne peut pas supprimer un compte administrateur
    if (admin.role === "collaborateur" && existing.role === "admin") {
      return NextResponse.json(
        { error: "Un collaborateur ne peut pas supprimer un compte administrateur." },
        { status: 403 }
      )
    }

    // Protéger l'administrateur principal
    if (existing.role === "admin") {
      const principal = await db
        .select({ id: user.id })
        .from(user)
        .where(eq(user.role, "admin"))
        .orderBy(user.createdAt)
        .limit(1)
      if (principal[0]?.id === existing.id) {
        return NextResponse.json(
          { error: "L'administrateur principal ne peut pas être supprimé." },
          { status: 403 }
        )
      }
    }

    // Protection des données métier : vérifier les liens avant suppression
    const [reservationsAsClient] = await db
      .select({ count: count() })
      .from(reservation)
      .where(eq(reservation.userId, id))
    const [reservationsAsVendor] = await db
      .select({ count: count() })
      .from(reservation)
      .where(eq(reservation.vendorId, id))
    const [points] = await db
      .select({ count: count() })
      .from(pointDeVente)
      .where(eq(pointDeVente.vendorId, id))
    const [dispos] = await db
      .select({ count: count() })
      .from(disponibilite)
      .where(eq(disponibilite.vendorId, id))

    const hasBusinessData =
      Number(reservationsAsClient.count) > 0 ||
      Number(reservationsAsVendor.count) > 0 ||
      Number(points.count) > 0 ||
      Number(dispos.count) > 0

    if (hasBusinessData) {
      return NextResponse.json(
        {
          error: "Ce compte ne peut pas être supprimé : il est lié à des données métier (réservations, points de vente ou disponibilités).",
          details: {
            reservationsAsClient: Number(reservationsAsClient.count),
            reservationsAsVendor: Number(reservationsAsVendor.count),
            pointsDeVente: Number(points.count),
            disponibilites: Number(dispos.count),
          },
        },
        { status: 400 }
      )
    }

    await db.delete(user).where(eq(user.id, id))

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "user",
        targetId: id,
        action: "delete",
        details: JSON.stringify({ name: existing.name, email: existing.email, role: existing.role }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Compte supprimé avec succès",
    })
  } catch (err) {
    console.error("[admin/users/[id] DELETE] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la suppression de l'utilisateur" },
      { status: 500 }
    )
  }
}
