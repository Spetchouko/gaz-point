/**
 * Server-side cache with TTL for API responses.
 * In-memory LRU cache with automatic expiration.
 * Suitable for Vercel serverless functions (persists within function instance).
 */

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
  tags: string[];
}

class ServerCache {
  private cache = new Map<string, CacheEntry<unknown>>();
  private maxSize = 500;
  private defaultTTL = 60_000; // 1 minute

  /**
   * Get cached data if valid.
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cache with TTL and tags for invalidation.
   */
  set<T>(key: string, data: T, options: { ttlMs?: number; tags?: string[] } = {}): void {
    // Evict oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (options.ttlMs ?? this.defaultTTL),
      tags: options.tags ?? [],
    });
  }

  /**
   * Invalidate cache entries by tag.
   */
  invalidateByTag(tag: string): number {
    let count = 0;
    for (const [key, entry] of this.cache.entries()) {
      if (entry.tags.includes(tag)) {
        this.cache.delete(key);
        count++;
      }
    }
    return count;
  }

  /**
   * Invalidate specific key.
   */
  invalidate(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache.
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache stats.
   */
  getStats(): { size: number; maxSize: number; hitRate?: number } {
    return { size: this.cache.size, maxSize: this.maxSize };
  }
}

// Singleton instance
export const serverCache = new ServerCache();

/**
 * Cache key generators for consistent naming.
 */
export const cacheKeys = {
  search: (criteria: Record<string, unknown>) =>
    `search:${JSON.stringify(criteria)}`,
  userReservations: (userId: string, page: number, pageSize: number) =>
    `reservations:user:${userId}:${page}:${pageSize}`,
  vendorOverview: (vendorId: string) => `vendor:overview:${vendorId}`,
  vendorAvailabilities: (vendorId: string) => `vendor:availabilities:${vendorId}`,
  vendorReservations: (vendorId: string, page: number, pageSize: number) =>
    `vendor:reservations:${vendorId}:${page}:${pageSize}`,
  adminDashboard: (period: string) => `admin:dashboard:${period}`,
  notificationsUnread: (userId: string) => `notifications:unread:${userId}`,
  pointDeVenteList: (filters: Record<string, unknown>) =>
    `points:${JSON.stringify(filters)}`,
};

/**
 * Cache tags for grouped invalidation.
 */
export const cacheTags = {
  reservations: 'reservations',
  availabilities: 'availabilities',
  vendors: 'vendors',
  users: 'users',
  notifications: 'notifications',
  points: 'points',
  admin: 'admin',
};

/**
 * Helper to invalidate related caches after mutations.
 */
export async function invalidateOnReservationChange(
  userId: string,
  vendorId?: string
): Promise<void> {
  serverCache.invalidateByTag(cacheTags.reservations);
  serverCache.invalidate(cacheKeys.notificationsUnread(userId));
  if (vendorId) {
    serverCache.invalidate(cacheKeys.vendorOverview(vendorId));
    serverCache.invalidate(cacheKeys.vendorReservations(vendorId, 1, 50));
  }
}

export async function invalidateOnAvailabilityChange(
  vendorId: string
): Promise<void> {
  serverCache.invalidateByTag(cacheTags.availabilities);
  serverCache.invalidate(cacheKeys.vendorOverview(vendorId));
  serverCache.invalidate(cacheKeys.vendorAvailabilities(vendorId));
}

export async function invalidateOnPointChange(
  vendorId: string
): Promise<void> {
  serverCache.invalidateByTag(cacheTags.points);
  serverCache.invalidate(cacheKeys.vendorOverview(vendorId));
}

/**
 * Wrapper for cached data fetching with automatic cache miss handling.
 */
export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: { ttlMs?: number; tags?: string[] } = {}
): Promise<T> {
  const cached = serverCache.get<T>(key);
  if (cached !== null) return cached;

  const data = await fetcher();
  serverCache.set(key, data, options);
  return data;
}