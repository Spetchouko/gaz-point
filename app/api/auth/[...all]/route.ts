import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { RateLimiter } from "@/lib/rate-limit";
import { NextResponse } from "next/server";

const handler = toNextJsHandler(auth);
const authRateLimiter = RateLimiter.ipOnly(10, 60 * 60_000); // 10 signup/sign-in per hour per IP

export const POST = (req: Request): Promise<Response> => {
  return handleAuthPost(req);
};

export const GET = (req: Request): Promise<Response> => {
  return handler.GET(req);
};

function handleAuthPost(req: Request): Response {
  const url = new URL(req.url);
  const path = url.pathname;

  // Rate limit sign-up and sign-in attempts per IP address
  if (
    path === "/api/auth/sign-up/email" ||
    path === "/api/auth/sign-in/email"
  ) {
    const check = authRateLimiter.checkRateLimit(req);
    if (!check.allowed) {
      return NextResponse.json(
        { error: "Too many requests" },
        { status: 429 }
      );
    }
  }

  return handler.POST(req);
}