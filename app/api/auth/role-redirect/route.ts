import { NextRequest, NextResponse } from "next/server"
import { getAuthenticatedAccountAccess } from "@/lib/auth-access"
import { SOCIAL_SIGNUP_INTENT_COOKIE } from "@/lib/auth-social-intent"
import {
  ACCOUNT_ACCESS_ERROR_CODES,
  ACCOUNT_ACCESS_MESSAGES,
  isStaffRole,
  type AccountAccessStatus,
} from "@/lib/auth-routing"
import { checkVendorAccess, getVendorAccessRedirect, VendorAccessStatus } from "@/lib/vendor-access"

export const dynamic = "force-dynamic"

type RoleRedirectAudience = "standard" | "staff"

function parseAudience(value: unknown): RoleRedirectAudience {
  return value === "staff" ? "staff" : "standard"
}

function errorResponse(status: AccountAccessStatus) {
  const code =
    ACCOUNT_ACCESS_ERROR_CODES[status] ??
    (status === "unauthenticated" ? "unauthenticated" : "session_error")
  const message =
    ACCOUNT_ACCESS_MESSAGES[code] ??
    "La session ne peut pas être vérifiée. Réessayez."

  return {
    status,
    code,
    message,
  }
}

function responseStatus(status: AccountAccessStatus): number {
  if (status === "unauthenticated") return 401
  if (status === "session_error") return 503
  return 403
}

function clearRegisterRoleCookie(response: NextResponse): NextResponse {
  response.cookies.set("gazpoint_register_role", "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
  })
  response.cookies.set(SOCIAL_SIGNUP_INTENT_COOKIE, "", {
    path: "/",
    maxAge: 0,
    sameSite: "lax",
    httpOnly: true,
  })
  return response
}

function staffOnlyResponse() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "staff_required",
        message: ACCOUNT_ACCESS_MESSAGES.staff_required,
      },
    },
    {
      status: 403,
      headers: { "Cache-Control": "no-store" },
    }
  )
}

export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => ({}))) as {
    audience?: unknown
  }
  const audience = parseAudience(body.audience)
  const access = await getAuthenticatedAccountAccess(req.headers)

  if (access.status !== "ready" || !access.redirectTo || !access.role) {
    const error = errorResponse(access.status)
    const response = NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message } },
      {
        status: responseStatus(access.status),
        headers: { "Cache-Control": "no-store" },
      }
    )
    return clearRegisterRoleCookie(response)
  }

  if (audience === "staff" && !isStaffRole(access.role)) {
    return clearRegisterRoleCookie(staffOnlyResponse())
  }

  // Vérification abonnement pour les vendeurs
  if (access.role === "vendor") {
    const vendorAccess = await checkVendorAccess(access.account!.id)
    if (vendorAccess.status !== "allowed") {
      const response = NextResponse.json(
        {
          ok: false,
          error: {
            code: vendorAccess.status,
            message: vendorAccess.message,
            redirectTo: vendorAccess.redirectTo,
          },
        },
        {
          status: 403,
          headers: { "Cache-Control": "no-store" },
        }
      )
      return clearRegisterRoleCookie(response)
    }
  }

  const response = NextResponse.json(
    { ok: true, role: access.role, redirectTo: access.redirectTo },
    { headers: { "Cache-Control": "no-store" } }
  )
  return clearRegisterRoleCookie(response)
}

export async function GET(req: NextRequest) {
  const audience = parseAudience(req.nextUrl.searchParams.get("audience"))
  const access = await getAuthenticatedAccountAccess(req.headers)

  if (
    access.status === "ready" &&
    access.redirectTo &&
    access.role &&
    (audience === "standard" || isStaffRole(access.role))
  ) {
    // Vérification abonnement pour les vendeurs
    if (access.role === "vendor") {
      const vendorAccess = await checkVendorAccess(access.account!.id)
      if (vendorAccess.status !== "allowed") {
        const redirectUrl = new URL(vendorAccess.redirectTo ?? getVendorAccessRedirect(vendorAccess.status), req.url)
        const response = NextResponse.redirect(redirectUrl)
        return clearRegisterRoleCookie(response)
      }
    }

    const response = NextResponse.redirect(new URL(access.redirectTo, req.url))
    return clearRegisterRoleCookie(response)
  }

  const error =
    access.status === "ready"
      ? { code: "staff_required", message: ACCOUNT_ACCESS_MESSAGES.staff_required }
      : errorResponse(access.status)
  const loginUrl = new URL(
    audience === "staff" ? "/connexion-admin" : "/connexion",
    req.url
  )
  if (error.code !== "unauthenticated") {
    loginUrl.searchParams.set("error", error.code)
  }

  const response = NextResponse.redirect(loginUrl)
  return clearRegisterRoleCookie(response)
}
