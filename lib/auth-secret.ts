import { isBuildPhase, optionalEnv } from "@/lib/env"

// Valeurs utilisées uniquement pendant `next build` et en développement.
// En production (`next start`), l'absence de configuration lève une erreur
// explicite au démarrage plutôt que de laisser Better Auth utiliser un secret
// par défaut (faille de sécurité) ou déduire l'origine de chaque requête.
const DEV_SECRET = "gazpoints-development-only-secret-do-not-use-in-production"
const BUILD_SECRET = "gazpoints-build-time-only-secret-do-not-use-in-production"

export function resolveAuthSecret(): string {
  const secret = optionalEnv("BETTER_AUTH_SECRET")
  if (secret) return secret
  if (isBuildPhase) return BUILD_SECRET
  if (process.env.NODE_ENV !== "production") return DEV_SECRET
  throw new Error(
    "[auth] BETTER_AUTH_SECRET est requis en production. Générez-en un avec `openssl rand -base64 32`."
  )
}
