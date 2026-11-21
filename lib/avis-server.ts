import type { avis } from "@/db/schema"
import { getCurrentUser } from "@/lib/session"
import type { AvisMine } from "@/lib/avis-shared"

export type AvisAuthor = {
  id: string
  name: string
  image: string | null
  role: "client" | "vendor"
}

/**
 * Rôle d'un auteur autorisé à déposer un avis. Le rôle vient de la session
 * serveur : il n'est jamais accepté depuis le client.
 */
export async function getAvisAuthor(): Promise<AvisAuthor | null> {
  const user = await getCurrentUser()
  if (!user) return null
  if (user.role !== "client" && user.role !== "vendor") return null

  return {
    id: user.id,
    name: user.name,
    image: user.image ?? null,
    role: user.role,
  }
}

/** Sérialise un avis pour son auteur, sans exposer les autres auteurs. */
export function toAvisMine(row: typeof avis.$inferSelect): AvisMine {
  return {
    id: row.id,
    rating: row.rating,
    quote: row.quote,
    status: row.status as AvisMine["status"],
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}

/** Un avis publié ne doit plus être modifié ni retiré par son auteur. */
export function avisIsEditableByOwner(status: string): boolean {
  return status === "pending" || status === "rejected"
}
