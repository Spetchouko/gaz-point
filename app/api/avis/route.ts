import { NextResponse } from "next/server"
import { desc, eq } from "drizzle-orm"
import { z } from "zod"
import { db } from "@/db"
import { avis } from "@/db/schema"
import { getAvisAuthor, toAvisMine } from "@/lib/avis-server"
import { AVIS_RATING_MAX, AVIS_RATING_MIN } from "@/lib/avis-shared"
import { errorMessage } from "@/lib/errors"

export const dynamic = "force-dynamic"

const submissionSchema = z.object({
  rating: z
    .number()
    .int()
    .min(AVIS_RATING_MIN)
    .max(AVIS_RATING_MAX),
  quote: z.string().trim().min(10).max(1000),
})

/** Avis de l'utilisateur authentifié. Aucune donnée d'un autre auteur. */
export async function GET() {
  const author = await getAvisAuthor()
  if (!author) {
    return NextResponse.json(
      { error: "Authentification requise" },
      { status: 401 }
    )
  }

  try {
    const rows = await db
      .select()
      .from(avis)
      .where(eq(avis.userId, author.id))
      .orderBy(desc(avis.createdAt))
      .limit(1)

    return NextResponse.json({ avis: rows[0] ? toAvisMine(rows[0]) : null })
  } catch (error) {
    console.error(`[avis] Lecture impossible : ${errorMessage(error)}`)
    return NextResponse.json(
      { error: "Impossible de charger votre avis" },
      { status: 500 }
    )
  }
}

/** Soumission d'un avis. Un seul avis par utilisateur, toujours modéré. */
export async function POST(request: Request) {
  const author = await getAvisAuthor()
  if (!author) {
    return NextResponse.json(
      { error: "Authentification requise" },
      { status: 401 }
    )
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Requête invalide" }, { status: 400 })
  }

  const parsed = submissionSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: `La note doit être comprise entre ${AVIS_RATING_MIN} et ${AVIS_RATING_MAX} et le commentaire entre 10 et 1000 caractères.`,
      },
      { status: 400 }
    )
  }

  try {
    const existing = await db
      .select()
      .from(avis)
      .where(eq(avis.userId, author.id))
      .orderBy(desc(avis.createdAt))
      .limit(1)

    if (existing.length > 0) {
      return NextResponse.json(
        {
          error: "Vous avez déjà soumis un avis.",
          avis: toAvisMine(existing[0]),
        },
        { status: 409 }
      )
    }

    const [created] = await db
      .insert(avis)
      .values({
        id: crypto.randomUUID(),
        userId: author.id,
        authorName: author.name,
        authorRole: author.role,
        authorImage: author.image,
        quote: parsed.data.quote,
        rating: parsed.data.rating,
        status: "pending",
      })
      .returning()

    return NextResponse.json({ avis: toAvisMine(created) }, { status: 201 })
  } catch (error) {
    console.error(`[avis] Soumission impossible : ${errorMessage(error)}`)
    return NextResponse.json(
      { error: "Impossible d'enregistrer votre avis" },
      { status: 500 }
    )
  }
}
