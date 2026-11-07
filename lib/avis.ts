import { desc, eq } from "drizzle-orm"
import { db } from "@/db"
import { avis } from "@/db/schema"
import {
  avisTypeFromRole,
  type AvisPublic,
  type AvisStatus,
} from "@/lib/avis-shared"
import { errorMessage } from "@/lib/errors"

export {
  AVIS_STATUSES,
  AVIS_STATUS_LABELS,
  avisTypeFromRole,
  toAvisStatus,
  type AvisStatus,
  type AvisType,
  type AvisPublic,
} from "@/lib/avis-shared"

/**
 * Seuls les avis approuvés par l'administration sont publics.
 * Cette fonction est l'unique point de lecture destiné au site public.
 *
 * Les avis sont un contenu optionnel de la landing : une base indisponible ne
 * doit pas faire échouer le rendu. On ne loggue que le message, sans exposer
 * la requête SQL ni la stack Drizzle dans la console.
 */
export async function getApprovedAvis(): Promise<AvisPublic[]> {
  try {
    const rows = await db
      .select()
      .from(avis)
      .where(eq(avis.status, "approved"))
      .orderBy(desc(avis.createdAt))

    return rows.map((row) => ({
      id: row.id,
      name: row.authorName,
      city: row.city,
      quote: row.quote,
      type: avisTypeFromRole(row.authorRole),
      avatarUrl: row.authorImage,
    }))
  } catch (error) {
    console.warn(`[avis] Lecture des avis impossible : ${errorMessage(error)}`)
    return []
  }
}

export type AvisAdminRow = {
  id: string
  authorName: string
  authorRole: string
  authorImage: string | null
  city: string | null
  quote: string
  status: AvisStatus
  createdAt: Date | string
}
