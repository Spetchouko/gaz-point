import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

/**
 * Middleware/proxy d'authentification centralisé pour GazPoints.
 *
 * Vérifie la session côté serveur AVANT le rendu de chaque page protégée.
 * Cela élimine le clignotement "connecté/déconnecté" lié à l'hydratation
 * client : l'utilisateur est soit redirigé avant le rendu, soit la page
 * est servie avec la certitude que sa session est valide.
 *
 * Rôles gérés :
 * - client   -> /dashboard
 * - vendor   -> /dashboard/vendeur (+ /dashboard/depot/*)
 * - admin    -> /dashboard/admin (+ sous-routes)
 * - collaborateur -> /dashboard/collaborateur (+ /dashboard/admin/* avec permissions)
 */
export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Routes statiques et API : laisser passer sans vérification ────────
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/favicon.ico") ||
    pathname.startsWith("/sitemap") ||
    pathname.startsWith("/robots") ||
    pathname.startsWith("/opengraph-image") ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/brand/") ||
    pathname.startsWith("/images/")
  ) {
    return NextResponse.next()
  }

  // ── Récupération de la session côté serveur ───────────────────────────
  let session
  try {
    session = await auth.api.getSession({ headers: req.headers })
  } catch {
    // Base de données indisponible ou session invalide : traiter comme non connecté.
    session = null
  }

  const user = session?.user
  const isAuthenticated = !!user
  const role = (user?.role ?? "client") as string
  const mustChangePassword = (user as { mustChangePassword?: boolean } | undefined)
    ?.mustChangePassword === true

  // ── Détection du type de route ────────────────────────────────────────
  const isAuthPage = pathname === "/connexion" || pathname === "/connexion-admin"
  const isRegisterPage = pathname.startsWith("/inscription")
  const isDashboardClient =
    pathname === "/dashboard" ||
    (pathname.startsWith("/dashboard/") &&
      !pathname.startsWith("/dashboard/admin") &&
      !pathname.startsWith("/dashboard/vendeur") &&
      !pathname.startsWith("/dashboard/collaborateur") &&
      !pathname.startsWith("/dashboard/depot"))
  const isDashboardVendor =
    pathname.startsWith("/dashboard/vendeur") ||
    pathname.startsWith("/dashboard/depot")
  const isDashboardAdmin = pathname.startsWith("/dashboard/admin")
  const isDashboardCollaborateur = pathname.startsWith("/dashboard/collaborateur")
  const isMotDePasseTemporaire = pathname === "/mot-de-passe-temporaire"

  const isDashboardRoute =
    isDashboardClient || isDashboardVendor || isDashboardAdmin || isDashboardCollaborateur

  // ── 5. Collaborateur avec mot de passe temporaire → la page obligatoire ──
  if (isAuthenticated && role === "collaborateur" && mustChangePassword && !isMotDePasseTemporaire) {
    return NextResponse.redirect(new URL("/mot-de-passe-temporaire", req.url))
  }

  // Si sur la page mot-de-passe-temporaire mais n'est pas un collaborateur
  // avec mot de passe temporaire, rediriger vers le dashboard approprié.
  if (isAuthenticated && isMotDePasseTemporaire && !(role === "collaborateur" && mustChangePassword)) {
    const defaultRedirect =
      role === "admin" ? "/dashboard/admin" :
      role === "vendor" ? "/dashboard/vendeur" :
      role === "collaborateur" ? "/dashboard/collaborateur" :
      "/dashboard"
    return NextResponse.redirect(new URL(defaultRedirect, req.url))
  }

  // ── 1. Utilisateur NON authentifié qui tente d'accéder à un dashboard ──
  if (!isAuthenticated && isDashboardRoute) {
    const loginUrl =
      role === "admin" || role === "collaborateur" ? "/connexion-admin" : "/connexion"
    return NextResponse.redirect(new URL(loginUrl, req.url))
  }

  // ── 2. Utilisateur NON authentifié sur la page mot-de-passe-temporaire ──
  if (!isAuthenticated && isMotDePasseTemporaire) {
    return NextResponse.redirect(new URL("/connexion-admin", req.url))
  }

  // ── 3. Utilisateur authentifié sur une page de connexion/inscription ──
  if (isAuthenticated && (isAuthPage || isRegisterPage)) {
    if (role === "admin") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url))
    }
    if (role === "collaborateur") {
      return NextResponse.redirect(new URL("/dashboard/collaborateur", req.url))
    }
    if (role === "vendor") {
      return NextResponse.redirect(new URL("/dashboard/vendeur", req.url))
    }
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  // ── 4. Contrôle des rôles sur les dashboards spécifiques ──────────────
  if (isAuthenticated && isDashboardRoute) {
    // Admin/collaborateur sur le dashboard générique client -> admin
    if (isDashboardClient && (role === "admin" || role === "collaborateur")) {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url))
    }
    // Client sur un dashboard vendeur/admin/collaborateur -> dashboard client
    if (role === "client") {
      if (isDashboardVendor || isDashboardAdmin || isDashboardCollaborateur) {
        return NextResponse.redirect(new URL("/dashboard", req.url))
      }
    }
    // Vendeur sur dashboard admin/collaborateur -> dashboard vendeur
    if (role === "vendor") {
      if (isDashboardAdmin || isDashboardCollaborateur) {
        return NextResponse.redirect(new URL("/dashboard/vendeur", req.url))
      }
    }
    // Collaborateur sur dashboard admin -> autorisé (il a accès)
    // Collaborateur sur dashboard client -> dashboard collaborateur
    if (role === "collaborateur" && isDashboardClient) {
      return NextResponse.redirect(new URL("/dashboard/collaborateur", req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/connexion",
    "/connexion-admin",
    "/inscription/:path*",
    "/mot-de-passe-temporaire"
  ]
}
