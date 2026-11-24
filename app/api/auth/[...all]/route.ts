import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { RateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { withTransientRetry } from "@/lib/transient-retry";

const handler = toNextJsHandler(auth);
const authRateLimiter = RateLimiter.ipOnly(10, 60 * 60_000); // 10 signup/sign-in per hour per IP

export const POST = (req: Request): Promise<Response> => {
  return handleAuthPost(req);
};

export const GET = (req: Request): Promise<Response> => {
  return handler.GET(req);
};

async function handleAuthPost(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;
  const startTime = Date.now();

  // Rate limit sign-up and sign-in attempts per IP address
  if (
    path === "/api/auth/sign-up/email" ||
    path === "/api/auth/sign-in/email"
  ) {
    const check = authRateLimiter.checkRateLimit(req);
    if (!check.allowed) {
      console.warn("[AUTH] Rate limit exceeded", { path, ip: getClientIp(req) });
      return Response.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }

  // Le driver Neon (@neondatabase/serverless) passe par HTTP et utilise fetch.
  // Une requête peut échouer ponctuellement (TypeError: fetch failed, coupure,
  // limite de débit). Ces erreurs transitoires ne doivent pas faire échouer
  // l'authentification d'un utilisateur dont les identifiants sont valides.
  // withTransientRetry relance l'opération sur ces erreurs uniquement ; les
  // erreurs métier et les redirections Next.js remontent immédiatement.
  try {
    const response = await withTransientRetry(() => handler.POST(req));
    
    // Diagnostic logging for auth responses (without sensitive data)
    const duration = Date.now() - startTime;
    if (path === "/api/auth/sign-in/email" || path === "/api/auth/sign-up/email") {
      const responseClone = response.clone();
      // Fire-and-forget logging without blocking the response
      responseClone.json().then((body: unknown) => {
        const b = body as Record<string, unknown> | null;
        console.log("[AUTH] Response", {
          path,
          status: response.status,
          durationMs: duration,
          hasError: !response.ok,
          errorCode: (b?.error as Record<string, unknown> | undefined)?.code as string | undefined || (b?.code as string | undefined),
          errorMessage: (b?.error as Record<string, unknown> | undefined)?.message as string | undefined || (b?.message as string | undefined),
        });
      }).catch(() => {
        // Ignore JSON parse errors for non-JSON responses
      });
    }
    
    return response;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error("[AUTH] Handler error", {
      path,
      durationMs: duration,
      errorName: error instanceof Error ? error.name : "Unknown",
      errorMessage: error instanceof Error ? error.message : String(error),
      isTransient: isTransientErrorForLogging(error),
    });
    throw error;
  }
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function isTransientErrorForLogging(error: unknown): boolean {
  if (!(error instanceof Error)) return false;
  const TRANSIENT_MARKERS = [
    "fetch failed", "fetch error", "network error", "econnreset",
    "econnrefused", "etimedout", "epipe", "socket hang up",
    "other side closed", "und_err", "getaddrinfo", "premature close",
    "request timeout", "timed out", "too many requests", "rate limit",
    "bad gateway", "service unavailable", "gateway timeout",
  ];
  const description = `${error.name}: ${error.message}`.toLowerCase();
  return TRANSIENT_MARKERS.some((marker) => description.includes(marker));
}