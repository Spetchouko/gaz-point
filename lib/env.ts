/**
 * Accès centralisé aux variables d'environnement.
 *
 * Deux contextes doivent être distingués :
 * - `next build` (NEXT_PHASE === "phase-production-build") : la collecte des
 *   routes ne doit dépendre d'aucun secret ni d'aucune base de données ;
 * - l'exécution (`next start`) : la configuration est obligatoire et une
 *   variable manquante doit échouer immédiatement avec un message explicite.
 */

export const isBuildPhase =
  process.env.NEXT_PHASE === "phase-production-build"

/** Variable optionnelle, `undefined` si absente ou vide. */
export function optionalEnv(name: string): string | undefined {
  const value = process.env[name]?.trim()
  return value ? value : undefined
}

/** Variable obligatoire au runtime. */
export function requiredEnv(name: string): string {
  const value = optionalEnv(name)
  if (!value) {
    throw new Error(
      `[env] ${name} est manquant. Renseignez-le dans .env (voir .env.example).`
    )
  }
  return value
}
