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
 * 
 * Pour Neon, on utilise la connexion directe (sans pooler) depuis WSL car le
 * pooler peut causer des ECONNRESET. Le paramètre `channel_binding=require`
 * est retiré car incompatible avec le driver pg standard.
 * sslmode=verify-full est forcé pour compatibilité pg v9+.
 */
function createDatabase() {
  let url = requiredEnv("DATABASE_URL")
  
  // Parser l'URL pour manipuler les paramètres de manière robuste
  const parsedUrl = new URL(url)
  
  // Si l'URL utilise un pooler Neon, basculer vers la connexion directe
  // pour éviter les ECONNRESET depuis WSL
  if (parsedUrl.hostname.includes("-pooler.")) {
    parsedUrl.hostname = parsedUrl.hostname.replace("-pooler.", ".")
  }
  
  // Retirer channel_binding=require qui n'est pas supporté par pg
  parsedUrl.searchParams.delete("channel_binding")
  
  // Forcer sslmode=verify-full (recommandé pour pg v9+, évite l'avertissement de sécurité)
  parsedUrl.searchParams.set("sslmode", "verify-full")
  
  const finalUrl = parsedUrl.toString()
  
  const pool = new Pool({ connectionString: finalUrl, max: 10, ssl: { rejectUnauthorized: false } })
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
