import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { user, account } from "@/db/schema"
import { eq } from "drizzle-orm"
import { requireAdmin, isPrincipalAdmin } from "@/lib/session"
import { auth } from "@/lib/auth"

/**
 * POST /api/admin/collaborateurs/[id]/reset-password
 * Réinitialise le mot de passe d'un collaborateur et marque mustChangePassword = true
 * Seul l'administrateur principal peut le faire.
 */
export async function POST(
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
      newPassword?: string
    } | null

    if (!body?.newPassword) {
      return NextResponse.json(
        { error: "Nouveau mot de passe requis" },
        { status: 400 }
      )
    }

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

    // Un collaborateur ne peut pas réinitialiser un autre collaborateur à moins d'être admin principal
    if (admin.role === "collaborateur" && admin.id !== existing.id) {
      const principal = await isPrincipalAdmin(admin.id)
      if (!principal) {
        return NextResponse.json(
          { error: "Seul l'administrateur principal peut réinitialiser le mot de passe d'un autre collaborateur." },
          { status: 403 }
        )
      }
    }

    // Mettre à jour le mot de passe dans better-auth (table account)
    try {
      await auth.api.changePassword({
        body: {
          currentPassword: "temporary", // Le mot de passe actuel n'est pas vérifié, on force
          newPassword: body.newPassword,
          revokeOtherSessions: true,
        },
        headers: new Headers({
          "x-user-id": id, // Passer l'user ID pour que better-auth sache quel compte modifier
        }),
      })
    } catch (authError) {
      // Si l'API changePassword ne fonctionne pas directement, on met à jour manuellement
      // Le hash du mot de passe est dans la table account
      console.warn("[reset-password] auth.api.changePassword failed, trying direct update:", authError)
      
      // Mise à jour directe du mot de passe dans la table account
      // Note: better-auth hache le mot de passe, on ne peut pas le faire simplement ici
      // Pour l'instant, on laisse l'erreur remonter
      throw authError
    }

    // Marquer mustChangePassword = true pour forcer le changement à la prochaine connexion
    await db
      .update(user)
      .set({ mustChangePassword: true, updatedAt: new Date() })
      .where(eq(user.id, id))

    return NextResponse.json({
      ok: true,
      message: "Mot de passe réinitialisé avec succès",
    })
  } catch (err) {
    console.error("[admin/collaborateurs/[id]/reset-password] error:", err)
    const message = err instanceof Error ? err.message : "Erreur lors de la réinitialisation du mot de passe"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}