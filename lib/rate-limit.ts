/**
 * Lightweight in-memory rate limiter using a sliding window algorithm.
 *
 * Key → array of timestamps within the current window.
 * On each check, old timestamps are pruned and the count is compared
 * against maxRequests.
 */
export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number
}

export class RateLimiter {
  private readonly map: Map<string, number[]> = new Map()
  private readonly maxRequests: number
  private readonly windowMs: number
  private readonly keyFn: (req: Request) => string

  constructor(maxRequests: number, windowMs: number, keyFn?: (req: Request) => string) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.keyFn = keyFn ?? ((req: Request) => clientIp(req))
  }

  /** Create an instance keyed strictly on client IP. */
  static ipOnly(maxRequests: number, windowMs: number): RateLimiter {
    return new RateLimiter(maxRequests, windowMs, (req) => clientIp(req))
  }

  /** Create an instance keyed on a single identifier string. */
  static key(key: string): RateLimiter {
    return new RateLimiter(0, 0, () => key)
  }

  checkRateLimit(keyOrReq: string | Request): RateLimitResult {
    const req = typeof keyOrReq === "string" ? null : keyOrReq
    const key = typeof keyOrReq === "string" ? keyOrReq : this.keyFn(keyOrReq as Request)
    const now = Date.now()
    const cutoff = now - this.windowMs

    const timestamps = this.map.get(key) ?? []
    // Prune timestamps outside the current window
    const fresh = timestamps.filter((ts) => ts > cutoff)

    if (fresh.length >= this.maxRequests) {
      this.map.set(key, fresh)
      return {
        allowed: false,
        remaining: 0,
        resetAt: fresh[0] + this.windowMs,
      }
    }

    const remaining = Math.max(0, this.maxRequests - fresh.length - 1)
    const nextWindowStart = now + this.windowMs
    fresh.push(now)
    this.map.set(key, fresh)

    return {
      allowed: true,
      remaining,
      resetAt: nextWindowStart,
    }
  }
}

/** Default singleton instance (simple implementation). */
export const defaultRateLimiter = new RateLimiter(100, 60_000)

/** Contact form limiter: max 5 messages per hour per IP address. */
export const contactRateLimiter = RateLimiter.ipOnly(5, 60 * 60 * 1000)

/** Email OTP send limiter: max 5 verification sends per hour per IP address. */
export const verificationSendRateLimiter = RateLimiter.ipOnly(5, 60 * 60 * 1000)

function getClientIp(req: Request): string {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  return ip
}

/** Get IP address from a Request. */
export function clientIp(req: Request): string {
  return getClientIp(req)
}
