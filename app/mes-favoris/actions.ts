"use server"

import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { favori, pointDeVente } from "@/db/schema"
import { requireUser } from "@/lib/session"

export async function toggleFavori(pointId: string): Promise<void> {
  const user = await requireUser()

  const [point] = await db
    .select({ id: pointDeVente.id })
    .from(pointDeVente)
    .where(eq(pointDeVente.id, pointId))
    .limit(1)
  if (!point) return

  const existing = await db
    .select({ id: favori.id })
    .from(favori)
    .where(and(eq(favori.userId, user.id), eq(favori.pointId, pointId)))
    .limit(1)

  if (existing.length > 0) {
    await db.delete(favori).where(eq(favori.id, existing[0].id))
  } else {
    await db
      .insert(favori)
      .values({ id: randomUUID(), userId: user.id, pointId })
  }

  revalidatePath("/mes-favoris")
}
