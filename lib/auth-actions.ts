"use server"

import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import { eq } from "drizzle-orm"
import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user } from "@/db/schema"
import type { ActionResult } from "@/lib/action-result"

/**
 * Change le mot de passe temporaire d'un collaborateur.
 * Action serveur appelée depuis la page /mot-de-passe-temporaire.
 */
export async function changeTemporaryPassword(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const currentPassword = formData.get("currentPassword") as string
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!currentPassword || !newPassword || !confirmPassword) {
    return { ok: false, message: "Tous les champs sont requis." }
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, message: "Les mots de passe ne correspondent pas." }
  }

  if (newPassword.length < 8) {
    return {
      ok: false,
      message: "Le mot de passe doit contenir au moins 8 caractères.",
    }
  }

  try {
    const requestHeaders = await headers()
    const session = await auth.api.getSession({ headers: requestHeaders })
    if (!session?.user) {
      return { ok: false, message: "Session invalide." }
    }

    const userId = session.user.id
    const [account] = await db
      .select({ role: user.role, mustChangePassword: user.mustChangePassword })
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    if (
      !account ||
      account.role !== "collaborateur" ||
      account.mustChangePassword !== true
    ) {
      return { ok: false, message: "Action non autorisée." }
    }

    await auth.api.changePassword({
      body: {
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      },
      headers: requestHeaders,
    })

    await db
      .update(user)
      .set({ mustChangePassword: false, updatedAt: new Date() })
      .where(eq(user.id, userId))

    revalidatePath("/mot-de-passe-temporaire")
    return { ok: true, message: "Mot de passe modifié avec succès." }
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erreur lors du changement de mot de passe."
    return { ok: false, message }
  }
}
