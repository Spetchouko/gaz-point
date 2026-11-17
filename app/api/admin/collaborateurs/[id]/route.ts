import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import {
  user,
  collaborateurPermission,
  adminAction,
} from "@/db/schema"
import { eq, count, and, or } from "drizzle-orm"
import { requireAdmin, isPrincipalAdmin } from "@/lib/session"

const VALID_MODULES = [
  "utilisateurs",
  "clients",
  "vendeurs",
  "disponibilites",
  "reservations",
  "publicite",
  "collaborateurs",
  "marketing",
  "avis",
  "statistiques",
]

/**
 * PATCH /api/admin/collaborateurs/[id]
 * Modifie les informations et les permissions d'un collaborateur.
 * Un collaborateur ne peut pas se retirer ses propres permissions critiques
 * ni se supprimer. L'administrateur principal est protégé.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json().catch(() => null)) as {
      name?: string
      email?: string
      phoneNumber?: string | null
      isActive?: boolean
      permissions?: string[]
    } | null

    const [existing] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role, isActive: user.isActive })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 })
    }
    if (existing.role !== "collaborateur") {
      return NextResponse.json({ error: "Ce compte n'est pas un collaborateur" }, { status: 400 })
    }

    // Empêcher l'auto-modification du rôle/désactivation par soi-même
    if (existing.id === admin.id) {
      if (body.isActive === false) {
        return NextResponse.json(
          { error: "Vous ne pouvez pas désactiver votre propre compte" },
          { status: 400 }
        )
      }
    }

    // Un collaborateur ne peut pas modifier un autre collaborateur à moins d'être admin principal
    if (admin.role === "collaborateur" && admin.id !== existing.id) {
      const principal = await isPrincipalAdmin(admin.id)
      if (!principal) {
        return NextResponse.json(
          { error: "Seul l'administrateur principal peut modifier un autre collaborateur." },
          { status: 403 }
        )
      }
    }

    const updates: Record<string, unknown> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.email !== undefined) updates.email = body.email
    if (body.phoneNumber !== undefined) updates.phoneNumber = body.phoneNumber || null
    if (body.isActive !== undefined) updates.isActive = body.isActive
    updates.updatedAt = new Date()

    if (Object.keys(updates).length > 0) {
      await db.update(user).set(updates).where(eq(user.id, id))
    }

    // Mettre à jour les permissions si fournies
    if (Array.isArray(body.permissions)) {
      const invalid = body.permissions.filter((p) => !VALID_MODULES.includes(p))
      if (invalid.length > 0) {
        return NextResponse.json(
          { error: `Permissions invalides : ${invalid.join(", ")}` },
          { status: 400 }
        )
      }

      // Supprimer les anciennes permissions
      await db
        .delete(collaborateurPermission)
        .where(eq(collaborateurPermission.collaboratorId, id))

      // Insérer les nouvelles
      for (const module of body.permissions) {
        await db.insert(collaborateurPermission).values({
          id: crypto.randomUUID(),
          collaboratorId: id,
          module,
          createdAt: new Date(),
        })
      }
    }

    // Traçabilité
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
          isActive: updates.isActive,
          permissions: body.permissions,
        }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    // Recharger les permissions à jour
    const rows = await db
      .select({ module: collaborateurPermission.module })
      .from(collaborateurPermission)
      .where(eq(collaborateurPermission.collaboratorId, id))
    const permissions = rows.map((r) => r.module)

    return NextResponse.json({
      ok: true,
      message: "Collaborateur mis à jour avec succès",
      collaborator: {
        id: existing.id,
        name: updates.name ?? existing.name,
        email: updates.email ?? existing.email,
        phoneNumber: updates.phoneNumber ?? existing.phoneNumber,
        isActive: updates.isActive ?? existing.isActive,
        permissions,
      },
    })
  } catch (err) {
    console.error("[admin/collaborateurs/[id] PATCH] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la modification du collaborateur" },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/admin/collaborateurs/[id]
 * Supprime un compte collaborateur. Protégé : pas d'auto-suppression,
 * pas de suppression de l'admin principal (qui n'est pas un collaborateur de toute façon).
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdmin()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params

    const [existing] = await db
      .select({ id: user.id, name: user.name, email: user.email, role: user.role })
      .from(user)
      .where(eq(user.id, id))
      .limit(1)

    if (!existing) {
      return NextResponse.json({ error: "Collaborateur introuvable" }, { status: 404 })
    }
    if (existing.role !== "collaborateur") {
      return NextResponse.json({ error: "Ce compte n'est pas un collaborateur" }, { status: 400 })
    }

    if (existing.id === admin.id) {
      return NextResponse.json(
        { error: "Vous ne pouvez pas supprimer votre propre compte" },
        { status: 400 }
      )
    }

    // Un collaborateur non principal ne peut pas supprimer un autre collaborateur
    if (admin.role === "collaborateur" && admin.id !== existing.id) {
      const principal = await isPrincipalAdmin(admin.id)
      if (!principal) {
        return NextResponse.json(
          { error: "Seul l'administrateur principal peut supprimer un collaborateur." },
          { status: 403 }
        )
      }
    }

    await db.delete(collaborateurPermission).where(eq(collaborateurPermission.collaboratorId, id))
    await db.delete(user).where(eq(user.id, id))

    // Traçabilité
    try {
      await db.insert(adminAction).values({
        id: crypto.randomUUID(),
        adminId: admin.id,
        targetType: "user",
        targetId: id,
        action: "delete",
        details: JSON.stringify({ name: existing.name, email: existing.email, role: "collaborateur" }),
        ipAddress: null,
        userAgent: null,
      })
    } catch {
      // ignore
    }

    return NextResponse.json({
      ok: true,
      message: "Collaborateur supprimé avec succès",
    })
  } catch (err) {
    console.error("[admin/collaborateurs/[id] DELETE] error:", err)
    return NextResponse.json(
      { error: "Erreur lors de la suppression du collaborateur" },
      { status: 500 }
    )
  }
}
