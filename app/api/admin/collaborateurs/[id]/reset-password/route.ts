import { NextRequest, NextResponse } from "next/server"
import { db } from "@/db"
import { account, user } from "@/db/schema"
import { and, eq } from "drizzle-orm"
import { requireAdminApi, revokeUserSessions } from "@/lib/session"
import { hashPassword } from "better-auth/crypto"

/**
 * POST /api/admin/collaborateurs/[id]/reset-password
 * Réinitialise le mot de passe d'un collaborateur et impose un nouveau choix
 * à sa prochaine connexion.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await requireAdminApi()
    if (!admin) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 })
    }

    const { id } = await params
    const body = (await req.json().catch(() => null)) as {
      newPassword?: string
    } | null
    const newPassword = body?.newPassword?.trim()

    if (!newPassword) {
      return NextResponse.json(
        { error: "Nouveau mot de passe requis" },
        { status: 400 }
      )
    }
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 8 caractères." },
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
      return NextResponse.json(
        { error: "Ce compte n'est pas un collaborateur" },
        { status: 400 }
      )
    }

    const hashedPassword = await hashPassword(newPassword)
    const [credential] = await db
      .select({ id: account.id })
      .from(account)
      .where(
        and(
          eq(account.userId, id),
          eq(account.providerId, "credential"),
          eq(account.accountId, id)
        )
      )
      .limit(1)

    if (credential) {
      await db
        .update(account)
        .set({ password: hashedPassword, updatedAt: new Date() })
        .where(eq(account.id, credential.id))
    } else {
      await db.insert(account).values({
        id: crypto.randomUUID(),
        accountId: id,
        providerId: "credential",
        userId: id,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    await db
      .update(user)
      .set({ mustChangePassword: true, updatedAt: new Date() })
      .where(eq(user.id, id))
    await revokeUserSessions(id)

    return NextResponse.json({
      ok: true,
      message: "Mot de passe réinitialisé avec succès",
    })
  } catch (err) {
    console.error("[admin/collaborateurs/[id]/reset-password] error:", err)
    const message =
      err instanceof Error
        ? err.message
        : "Erreur lors de la réinitialisation du mot de passe"
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
