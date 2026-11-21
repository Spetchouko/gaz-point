import { NextRequest, NextResponse } from "next/server"
import { RateLimiter } from "@/lib/rate-limit"
import {
  createSocialSignupIntent,
  SOCIAL_SIGNUP_INTENT_COOKIE,
  SOCIAL_SIGNUP_INTENT_MAX_AGE_SECONDS,
} from "@/lib/auth-social-intent"

const socialSignupIntentRateLimiter = RateLimiter.ipOnly(
  20,
  15 * 60 * 1000
)

export async function POST(req: NextRequest) {
  const limit = socialSignupIntentRateLimiter.checkRateLimit(req)
  if (!limit.allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques instants." },
      { status: 429 }
    )
  }

  const body = (await req.json().catch(() => null)) as {
    mode?: string
    role?: string
  } | null

  if (
    !body ||
    body.mode !== "signup" ||
    (body.role !== "client" && body.role !== "vendor")
  ) {
    return NextResponse.json(
      { error: "Intention d'inscription sociale invalide." },
      { status: 400 }
    )
  }

  const token = createSocialSignupIntent(body.role)
  const response = NextResponse.json(
    { ok: true },
    { headers: { "Cache-Control": "no-store" } }
  )

  response.cookies.set({
    name: SOCIAL_SIGNUP_INTENT_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SOCIAL_SIGNUP_INTENT_MAX_AGE_SECONDS,
  })

  return response
}
