import { NextResponse } from "next/server"
import { eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { avis } from "@/db/schema"
import {
  avisIsEditableByOwner,
  getAvisAuthor,
  toAvisMine,
} from "@/lib/avis-server"
import { AVIS_RATING_MAX, AVIS_RATING_MIN } from "@/lib/avis-shared"
import { errorMessage } from "@/lib/errors"

export const dynamic = "force-dynamic"

const updateSchema = z.object({
  rating: z.number().int().min(AVIS_RATING_MIN).max(AVIS_RATING_MAX),
  quote: z.string().trim().min(10).max(1000),
})

type RouteContext = { params: Promise<{ id: string }> }

/**
 * Modification du propre avis. Refusé dès que l'avis est publié ou masqué :
 * la publication reste sous le contrôle exclusif de l'administration.
 */
export async function PATCH(request: Request, { params }: RouteContext) {
  const author = await getAvisAuthor()
  if (!author) {
    return NextResponse.json(
      { error: "Authentification requise" },
      { status: 401 }
    )
  }

  const { id } = await params

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `La note doit être comprise entre ${AVIS_RATING_MIN} et ${AVIS_RATING_MAX} et le commentaire entre 10 et 1000 caractères.`,
      },
      { status: 400 }
    )
  }

  try {
    const [current] = await db
      .select()
      .from(avis)
      .where(eq(avis.id, id))
      .limit(1)

    if (!current) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 })
    }
    if (current.userId !== author.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }
    if (!avisIsEditableByOwner(current.status)) {
      return NextResponse.json(
        { error: "Cet avis ne peut plus être modifié" },
        { status: 403 }
      )
    }

    const [updated] = await db
      .update(avis)
      .set({
        rating: parsed.data.rating,
        quote: parsed.data.quote,
        status: "pending",
        updatedAt: new Date(),
      })
      .where(eq(avis.id, id))
      .returning()

    return NextResponse.json({ avis: toAvisMine(updated) })
  } catch (error) {
    console.error(`[avis/[id]] Modification impossible : ${errorMessage(error)}`)
    return NextResponse.json(
      { error: "Impossible de modifier votre avis" },
      { status: 500 }
    )
  }
}

/** Suppression du propre avis, uniquement avant sa publication. */
export async function DELETE(_request: Request, { params }: RouteContext) {
  const author = await getAvisAuthor()
  if (!author) {
    return NextResponse.json(
      { error: "Authentification requise" },
      { status: 401 }
    )
  }

  const { id } = await params

  try {
    const [current] = await db
      .select()
      .from(avis)
      .where(eq(avis.id, id))
      .limit(1)

    if (!current) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 })
    }
    if (current.userId !== author.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
    }
    if (!avisIsEditableByOwner(current.status)) {
      return NextResponse.json(
        { error: "Cet avis ne peut plus être supprimé" },
        { status: 403 }
      )
    }

    await db.delete(avis).where(eq(avis.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`[avis/[id]] Suppression impossible : ${errorMessage(error)}`)
    return NextResponse.json(
      { error: "Impossible de supprimer votre avis" },
      { status: 500 }
    )
  }
}
