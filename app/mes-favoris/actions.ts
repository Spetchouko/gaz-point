"use server"

import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { favori, pointDeVente } from "@/db/schema"
import { requireUser } from "@/lib/session"

export type ToggleFavoriResult = {
  ok: boolean
  isFavorite: boolean
  error?: string
}

/**
 * Ajoute ou retire un point de vente des favoris de l'utilisateur connecté.
 * Retourne l'état final (ajouté ou retiré) et une éventuelle erreur.
 */
export async function toggleFavori(
  pointId: string
): Promise<ToggleFavoriResult> {
  try {
    const user = await requireUser()

    const [point] = await db
      .select({ id: pointDeVente.id })
      .from(pointDeVente)
      .where(eq(pointDeVente.id, pointId))
      .limit(1)

    if (!point) {
      return { ok: false, isFavorite: false, error: "Point de vente introuvable." }
    }

    const existing = await db
      .select({ id: favori.id })
      .from(favori)
      .where(and(eq(favori.userId, user.id), eq(favori.pointId, pointId)))
      .limit(1)

    let isFavorite: boolean

    if (existing.length > 0) {
      await db.delete(favori).where(eq(favori.id, existing[0].id))
      isFavorite = false
    } else {
      await db
        .insert(favori)
        .values({ id: randomUUID(), userId: user.id, pointId })
      isFavorite = true
    }

    revalidatePath("/dashboard/favoris")
    revalidatePath("/mes-favoris")

    return { ok: true, isFavorite }
  } catch (error) {
    console.error("[toggleFavori] Erreur:", error)
    return {
      ok: false,
      isFavorite: false,
      error: error instanceof Error ? error.message : "Erreur inconnue.",
    }
  }
}
