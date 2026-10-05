"use server"

import { randomUUID } from "node:crypto"
import { and, eq } from "drizzle-orm"
import { revalidatePath } from "next/cache"
import { db } from "@/db"
import { pointDeVente, recharge } from "@/db/schema"
import { bottleFormats } from "@/lib/gaz"
import { requireUser } from "@/lib/session"

export type ActionResult = { ok: boolean; message: string }

export async function addRecharge(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser()

  const pointName = String(formData.get("pointName") ?? "").trim()
  const format = String(formData.get("format") ?? "")
  const priceRaw = String(formData.get("price") ?? "").trim()
  const dateRaw = String(formData.get("date") ?? "")

  if (!pointName) {
    return { ok: false, message: "Indique le dépôt où tu as fait ta recharge." }
  }
  if (!(bottleFormats as readonly string[]).includes(format)) {
    return { ok: false, message: "Choisis un format de bouteille." }
  }
  const price = Number(priceRaw)
  if (!priceRaw || !Number.isInteger(price) || price < 0) {
    return { ok: false, message: "Le prix doit être un montant entier en FCFA." }
  }
  if (!dateRaw) {
    return { ok: false, message: "Indique la date de la recharge." }
  }
  const purchasedAt = new Date(`${dateRaw}T12:00:00`)
  if (Number.isNaN(purchasedAt.getTime())) {
    return { ok: false, message: "La date n’est pas valide." }
  }

  const points = await db
    .select({ id: pointDeVente.id, name: pointDeVente.name })
    .from(pointDeVente)
  const match = points.find(
    (point) => point.name.toLowerCase() === pointName.toLowerCase()
  )

  await db.insert(recharge).values({
    id: randomUUID(),
    userId: user.id,
    pointId: match?.id ?? null,
    pointName: match?.name ?? pointName,
    format,
    price,
    purchasedAt,
  })

  revalidatePath("/mes-commandes")
  return { ok: true, message: "Recharge ajoutée à ton historique." }
}

export async function deleteRecharge(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const user = await requireUser()
  const id = String(formData.get("id") ?? "")
  if (!id) {
    return { ok: false, message: "Recharge introuvable." }
  }

  await db
    .delete(recharge)
    .where(and(eq(recharge.id, id), eq(recharge.userId, user.id)))

  revalidatePath("/mes-commandes")
  return { ok: true, message: "Recharge supprimée." }
}
