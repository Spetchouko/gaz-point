"use server"

import { randomUUID } from "node:crypto"
import { eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { avis } from "@/db/schema"
import { getCurrentUser } from "@/lib/session"

export type AvisActionResult = { ok: boolean; message: string }

const QUOTE_MIN = 10
const QUOTE_MAX = 600
const CITY_MAX = 80

/**
 * Dépôt / mise à jour de l'avis d'un utilisateur connecté.
 * Sécurité : le nom, le rôle et la photo proviennent de la session serveur,
 * jamais de l'entrée client. Un avis redevient « pending » à chaque soumission.
 */
export async function submitAvis(
  _prev: AvisActionResult | null,
  formData: FormData
): Promise<AvisActionResult> {
  const user = await getCurrentUser()
  if (!user) {
    return { ok: false, message: "Tu dois être connecté pour publier un avis." }
  }

  const role = user.role ?? "client"
  if (role !== "client" && role !== "vendor") {
    return {
      ok: false,
      message: "Seuls les usagers et les vendeurs peuvent publier un avis.",
    }
  }

  const quote = String(formData.get("quote") ?? "").trim()
  const city = String(formData.get("city") ?? "").trim()

  if (quote.length < QUOTE_MIN) {
    return {
      ok: false,
      message: `Ton avis doit contenir au moins ${QUOTE_MIN} caractères.`,
    }
  }
  if (quote.length > QUOTE_MAX) {
    return {
      ok: false,
      message: `Ton avis ne doit pas dépasser ${QUOTE_MAX} caractères.`,
    }
  }
  if (city.length > CITY_MAX) {
    return {
      ok: false,
      message: `La ville / le quartier ne doit pas dépasser ${CITY_MAX} caractères.`,
    }
  }

  const payload = {
    authorName: user.name,
    authorRole: role,
    authorImage: user.image ?? null,
    city: city || null,
    quote,
    status: "pending",
    updatedAt: new Date(),
  }

  const [existing] = await db
    .select({ id: avis.id })
    .from(avis)
    .where(eq(avis.userId, user.id))
    .limit(1)

  if (existing) {
    await db.update(avis).set(payload).where(eq(avis.id, existing.id))
  } else {
    await db.insert(avis).values({
      id: randomUUID(),
      userId: user.id,
      ...payload,
    })
  }

  revalidatePath("/avis")
  revalidatePath("/")

  return {
    ok: true,
    message:
      "Merci ! Ton avis sera publié après validation par l'équipe GazPoints.",
  }
}
