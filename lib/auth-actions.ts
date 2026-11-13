"use server"

import { auth } from "@/lib/auth"
import { db } from "@/db"
import { user } from "@/db/schema"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import type { ActionResult } from "@/lib/action-result"

/**
 * Change le mot de passe temporaire d'un collaborateur.
 * Action serveur appelée depuis la page /mot-de-passe-temporaire.
 */
export async function changeTemporaryPassword(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const newPassword = formData.get("newPassword") as string
  const confirmPassword = formData.get("confirmPassword") as string

  if (!newPassword || !confirmPassword) {
    return { ok: false, message: "Les deux champs sont requis." }
  }

  if (newPassword !== confirmPassword) {
    return { ok: false, message: "Les mots de passe ne correspondent pas." }
  }

  if (newPassword.length < 8) {
    return { ok: false, message: "Le mot de passe doit contenir au moins 8 caractères." }
  }

  const session = await auth.api.getSession({ headers: new Headers() })

  if (!session?.user) {
    return { ok: false, message: "Session invalide." }
  }

  const userId = session.user.id
  const userRole = (session.user as { role?: string }).role

  if (userRole !== "collaborateur") {
    return { ok: false, message: "Action non autorisée." }
  }

  try {
    await auth.api.changePassword({
      body: {
        currentPassword: "temporary", // Le mot de passe temporaire n'est pas vérifié, on force le changement
        newPassword,
        revokeOtherSessions: true,
      },
      headers: new Headers(),
    })

    // Marquer le mot de passe comme changé
    await db
      .update(user)
      .set({ mustChangePassword: false })
      .where(eq(user.id, userId))

    revalidatePath("/admin")
    return { ok: true, message: "Mot de passe modifié avec succès." }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur lors du changement de mot de passe."
    return { ok: false, message }
  }
}