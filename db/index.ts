import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { requiredEnv } from "@/lib/env"

function createDatabase() {
  const url = requiredEnv("DATABASE_URL")
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
