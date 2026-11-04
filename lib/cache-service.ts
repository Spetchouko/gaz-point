import Dexie, { type Table } from "dexie"

export interface SearchCache {
  id: string
  queryKey: string
  results: unknown[]
  fetchedAt: number
  expiresAt: number
}

class CacheDB extends Dexie {
  searches!: Table<SearchCache>

  constructor() {
    super("GazPointsCache")
    this.version(1).stores({
      searches: "id, queryKey, fetchedAt",
    })
  }
}

const db = new CacheDB()

export async function getCachedSearch(queryKey: string, maxAgeMs = 10 * 60 * 1000) {
  try {
    const row = await db.searches.get(queryKey)
    if (!row) return null
    if (Date.now() > row.expiresAt) {
      await db.searches.delete(queryKey)
      return null
    }
    return row.results
  } catch {
    return null
  }
}

export async function setCachedSearch(queryKey: string, results: unknown[], ttlMs = 10 * 60 * 1000) {
  try {
    await db.searches.put({
      id: queryKey,
      queryKey,
      results,
      fetchedAt: Date.now(),
      expiresAt: Date.now() + ttlMs,
    })
  } catch {
    // silencieux : pas de blocage en cas d'échec du cache
  }
}

export async function invalidateSearch(queryKey: string) {
  try {
    await db.searches.delete(queryKey)
  } catch {
    // silencieux
  }
}
