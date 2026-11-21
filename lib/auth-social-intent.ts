import { createHmac, randomUUID, timingSafeEqual } from "node:crypto"
import {
  addOAuthServerContext,
  createAuthMiddleware,
  getOAuthState,
} from "better-auth/api"
import { resolveAuthSecret } from "@/lib/auth-secret"
import type { PublicSignupRole } from "@/lib/auth-routing"

export const SOCIAL_SIGNUP_INTENT_COOKIE = "gazpoint_social_signup_intent"
export const SOCIAL_SIGNUP_INTENT_MAX_AGE_SECONDS = 5 * 60
export const SOCIAL_SIGNUP_ROLE_CONTEXT_KEY = "gazpointSocialSignupRole"
export const SOCIAL_SIGNUP_PROVIDER = "google"

export const GOOGLE_SOCIAL_PROVIDER_POLICY = {
  disableImplicitSignUp: true,
} as const

const SIGNATURE_DOMAIN = "gazpoint.social-signup-intent.v1"

type SocialSignupIntentPayload = {
  v: 1
  role: PublicSignupRole
  exp: number
  nonce: string
}

export type VerifiedSocialSignupIntent = {
  role: PublicSignupRole
  expiresAt: number
}

function isPublicSignupRole(value: unknown): value is PublicSignupRole {
  return value === "client" || value === "vendor"
}

function signatureFor(payload: string, secret: string): string {
  return createHmac("sha256", secret)
    .update(`${SIGNATURE_DOMAIN}.${payload}`)
    .digest("base64url")
}

export function createSocialSignupIntent(
  role: PublicSignupRole,
  now = Date.now(),
  secret = resolveAuthSecret()
): string {
  if (!isPublicSignupRole(role)) {
    throw new Error("Rôle d'inscription sociale invalide.")
  }

  const payload: SocialSignupIntentPayload = {
    v: 1,
    role,
    exp: now + SOCIAL_SIGNUP_INTENT_MAX_AGE_SECONDS * 1000,
    nonce: randomUUID(),
  }
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    "base64url"
  )

  return `${encodedPayload}.${signatureFor(encodedPayload, secret)}`
}

export function verifySocialSignupIntent(
  token: string | null | undefined,
  now = Date.now(),
  secret = resolveAuthSecret()
): VerifiedSocialSignupIntent | null {
  if (!token) return null

  const [encodedPayload, encodedSignature, ...extra] = token.split(".")
  if (!encodedPayload || !encodedSignature || extra.length > 0) return null

  const expectedSignature = Buffer.from(signatureFor(encodedPayload, secret))
  const receivedSignature = Buffer.from(encodedSignature)
  if (
    expectedSignature.length !== receivedSignature.length ||
    !timingSafeEqual(expectedSignature, receivedSignature)
  ) {
    return null
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8")
    ) as Partial<SocialSignupIntentPayload>

    if (payload.v !== 1) return null
    if (!isPublicSignupRole(payload.role)) return null
    if (!Number.isSafeInteger(payload.exp) || (payload.exp ?? 0) <= now) {
      return null
    }

    return {
      role: payload.role,
      expiresAt: payload.exp as number,
    }
  } catch {
    return null
  }
}

function readCookieValue(
  cookieHeader: string | null | undefined,
  cookieName: string
): string | null {
  if (!cookieHeader) return null

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=")
    if (separator < 0) continue

    const name = part.slice(0, separator).trim()
    if (name !== cookieName) continue

    const value = part.slice(separator + 1).trim()
    try {
      return decodeURIComponent(value)
    } catch {
      return value
    }
  }

  return null
}

export function resolveSocialSignupIntent(input: {
  requestedSignUp: boolean
  provider: unknown
  cookieHeader: string | null | undefined
  now?: number
  secret?: string
}): VerifiedSocialSignupIntent | null {
  if (!input.requestedSignUp) return null
  if (input.provider !== SOCIAL_SIGNUP_PROVIDER) return null

  const token = readCookieValue(
    input.cookieHeader,
    SOCIAL_SIGNUP_INTENT_COOKIE
  )
  return verifySocialSignupIntent(token, input.now, input.secret)
}

export function getSocialSignupRoleFromServerContext(
  serverContext: unknown
): PublicSignupRole | null {
  if (!serverContext || typeof serverContext !== "object") return null

  const role = (serverContext as Record<string, unknown>)[
    SOCIAL_SIGNUP_ROLE_CONTEXT_KEY
  ]
  return isPublicSignupRole(role) ? role : null
}

export function createSocialSignupBeforeHook(
  secret = resolveAuthSecret()
) {
  return createAuthMiddleware(async (ctx) => {
    if (ctx.path !== "/sign-in/social") return

    const body = (
      ctx.body && typeof ctx.body === "object" ? ctx.body : {}
    ) as Record<string, unknown>
    const intent = resolveSocialSignupIntent({
      requestedSignUp: body.requestSignUp === true,
      provider: body.provider,
      cookieHeader:
        ctx.request?.headers.get("cookie") ??
        ctx.headers?.get("cookie") ??
        "",
      secret,
    })

    if (intent) {
      await addOAuthServerContext({
        [SOCIAL_SIGNUP_ROLE_CONTEXT_KEY]: intent.role,
      })
    }

    return {
      context: {
        body: {
          ...body,
          requestSignUp: intent !== null,
        },
      },
    }
  })
}

export async function getServerTrustedSocialSignupRole(): Promise<PublicSignupRole> {
  try {
    const oauthState = await getOAuthState()
    return (
      getSocialSignupRoleFromServerContext(oauthState?.serverContext) ?? "client"
    )
  } catch {
    return "client"
  }
}
