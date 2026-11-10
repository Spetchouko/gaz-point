import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { requiredEnv } from "@/lib/env"

/**
 * Résout l'URL de base de données pour le client Neon HTTP.
 *
 * `@neondatabase/serverless` avec `drizzle-orm/neon-http` nécessite une
 * URL HTTPS (endpoint HTTP de Neon), pas une chaîne de connexion
 * `postgresql://`. Si une chaîne PostgreSQL est fournie (ex. avec un hôte
 * `-pooler` réservé à la connexion TCP poolée), on en extrait l'hôte et
 * les identifiants pour reconstruire une URL `https://` utilisable par
 * l'API SQL HTTP de Neon.
 */
function resolveNeonUrl(url: string): string {
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url
  }

  try {
    const parsed = new URL(url)
    if (parsed.protocol !== "postgresql:") {
      return url
    }

    let host = parsed.hostname
    // L'hôte -pooler est pour la connexion TCP poolée (port 5432), non l'API HTTP
    if (host.endsWith("-pooler")) {
      host = host.replace("-pooler", "")
    }

    const auth =
      parsed.username && parsed.password
        ? `${parsed.username}:${parsed.password}@`
        : ""

    return `https://${auth}${host}`
  } catch {
    return url
  }
}

function createDatabase() {
  const url = resolveNeonUrl(requiredEnv("DATABASE_URL"))
  return drizzle({ client: neon(url) })
}

type Database = ReturnType<typeof createDatabase>

let database: Database | undefined

function getDatabase(): Database {
  database ??= createDatabase()
  return database
}

/**
 * Connexion créée au premier accès, jamais à l'import.
 *
 * Cela permet à `next build` de collecter les routes sans base de données
 * accessible, et renvoie une erreur explicite (`DATABASE_URL` manquant) dès
 * la première requête au lieu d'une erreur Neon cryptique.
 */
export const db: Database = new Proxy({} as Database, {
  get(_target, property) {
    const instance = getDatabase()
    const value = Reflect.get(instance, property)
    return typeof value === "function" ? value.bind(instance) : value
  },
})
