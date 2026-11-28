import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import { requiredEnv, isBuildPhase } from "@/lib/env"

/**
 * Utilise le driver Neon HTTP (@neondatabase/serverless) qui utilise fetch.
 * Cela fonctionne correctement dans l'environnement WSL/Next.js où les
 * connexions TCP natives (pg) peuvent être bloquées/réinitialisées (ECONNRESET).
 * 
 * Le driver HTTP passe par l'API Neon qui gère le pooling de connexions côté serveur.
 * 
 * Optimisé pour serverless (Vercel) et développement local (WSL) :
 * - Pas de pool de connexions à gérer côté client
 * - Compatible avec les fonctions serverless (pas de connexions persistantes)
 * - Fonctionne en WSL sans problème de pare-feu/réseau
 */
function createDatabase() {
  let url = requiredEnv("DATABASE_URL")
  
  // Parser l'URL pour manipuler les paramètres
  const parsedUrl = new URL(url)
  
  // Retirer channel_binding=require qui n'est pas nécessaire pour le driver HTTP
  parsedUrl.searchParams.delete("channel_binding")
  
  // Forcer sslmode=require et uselibpqcompat pour compatibilité
  parsedUrl.searchParams.set("sslmode", "require")
  parsedUrl.searchParams.set("uselibpqcompat", "true")
  
  const finalUrl = parsedUrl.toString()
  
  console.log("[db] Using Neon HTTP driver (fetch-based):", parsedUrl.hostname)
  console.log("[db] Final connection string (sanitized):", parsedUrl.toString().replace(/:([^:@]+)@/, ":****@"))
  
  // Créer le client Neon HTTP
  const sql = neon(finalUrl)
  
  return drizzle({ client: sql })
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

/**
 * Pas de pool à fermer avec le driver HTTP (connexions éphémères via fetch).
 * En serverless, Vercel gère le cycle de vie.
 */
export async function closeDatabase(): Promise<void> {
  // Le driver HTTP n'a pas de pool persistant à fermer
  database = undefined
}