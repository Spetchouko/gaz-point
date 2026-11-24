import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { requiredEnv } from "@/lib/env"

/**
 * Utilise le driver PostgreSQL standard (pg) avec connexion TCP.
 * Cela contourne les problèmes de fetch HTTP (Turbopack) et WebSocket (Neon Pool)
 * qui sont bloqués dans l'environnement WSL/Next.js.
 * 
 * Le driver pg utilise le protocole PostgreSQL natif sur TCP qui passe
 * correctement dans cet environnement.
 */
function createDatabase() {
  const url = requiredEnv("DATABASE_URL")
  const pool = new Pool({ connectionString: url, max: 10, ssl: { rejectUnauthorized: false } })
  return drizzle({ client: pool })
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
