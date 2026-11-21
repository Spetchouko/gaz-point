import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getAuthenticatedAccountAccess } from "@/lib/auth-access"
import {
  ACCOUNT_ACCESS_ERROR_CODES,
  CLIENT_RESULTS_PATH,
  RESULTS_PATH,
  resolveDashboardAccess,
  resolveClientResultsAccess,
} from "@/lib/auth-routing"

function redirectTo(req: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, req.url))
}

/** Redirection vers la connexion en conservant la page demandée. */
function redirectToLoginFrom(
  req: NextRequest,
  loginPath = "/connexion"
): NextResponse {
  const loginUrl = new URL(loginPath, req.url)
  if (loginPath === "/connexion") {
    loginUrl.searchParams.set(
      "redirect",
      `${req.nextUrl.pathname}${req.nextUrl.search}`
    )
  }
  return NextResponse.redirect(loginUrl)
}

function loginPathFor(pathname: string): string {
  if (
    pathname === "/dashboard/admin" ||
    pathname.startsWith("/dashboard/admin/") ||
    pathname === "/dashboard/collaborateur" ||
    pathname.startsWith("/dashboard/collaborateur/")
  ) {
    return "/connexion-admin"
  }
  return "/connexion"
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  const isAuthPage =
    pathname === "/connexion" || pathname === "/connexion-admin"
  const isRegisterPage =
    pathname === "/inscription" || pathname.startsWith("/inscription/")
  const isDashboardPath =
    pathname === "/dashboard" || pathname.startsWith("/dashboard/")
  const isResultsPath = pathname === CLIENT_RESULTS_PATH
  const isResultsPathCanonical = pathname === CLIENT_RESULTS_PATH
  const isDashboardResultsPath =
    pathname.startsWith("/dashboard/") && pathname.includes("/resultats-recherche")
  const isTemporaryPasswordPage = pathname === "/mot-de-passe-temporaire"

  const access = await getAuthenticatedAccountAccess(req.headers)

  if (access.status === "ready" && access.role && access.redirectTo) {
    const mustChangePassword =
      access.account?.mustChangePassword === true

    if (access.role === "collaborateur" && mustChangePassword) {
      if (isTemporaryPasswordPage) {
        return NextResponse.next()
      }
      return redirectTo(req, "/mot-de-passe-temporaire")
    }

    if (isTemporaryPasswordPage) {
      return redirectTo(req, access.redirectTo)
    }

    if (isAuthPage || isRegisterPage) {
      return redirectTo(req, access.redirectTo)
    }

    if (isDashboardPath) {
      const decision = resolveDashboardAccess(
        pathname,
        access.role,
        mustChangePassword
      )
      if (!decision.allowed && decision.redirectTo) {
        return redirectTo(req, decision.redirectTo)
      }
    }

    // Gestion de la page de résultats canonique : seuls les clients
    // authentifiés peuvent y accéder directement ; les autres rôles sont
    // redirigés vers leur propre dashboard de résultats.
    if (isResultsPathCanonical) {
      const decision = resolveClientResultsAccess(access.role)
      if (!decision.allowed && decision.redirectTo) {
        return redirectTo(req, decision.redirectTo)
      }
    }

    return NextResponse.next()
  }

  if (access.status === "unauthenticated") {
    if (isDashboardPath) {
      return redirectToLoginFrom(req, loginPathFor(pathname))
    }
    // Rediriger vers connexion pour les deux types de routes résultats
    if (isResultsPathCanonical || pathname.startsWith("/dashboard/") && pathname.includes("/resultats-recherche")) {
      return redirectToLoginFrom(req)
    }
    if (isTemporaryPasswordPage) {
      return redirectTo(req, "/connexion-admin")
    }
    return NextResponse.next()
  }

  const errorCode =
    ACCOUNT_ACCESS_ERROR_CODES[access.status] ?? "session_error"
  if (isDashboardPath || isResultsPath || isTemporaryPasswordPage) {
    const loginPath = loginPathFor(pathname)
    const loginUrl = new URL(loginPath, req.url)
    loginUrl.searchParams.set("error", errorCode)
    if (loginPath === "/connexion") {
      loginUrl.searchParams.set(
        "redirect",
        `${req.nextUrl.pathname}${req.nextUrl.search}`
      )
    }
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/resultats-recherche",
    "/dashboard/:path*",
    "/connexion",
    "/connexion-admin",
    "/inscription/:path*",
    "/mot-de-passe-temporaire",
  ],
}
