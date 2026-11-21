export const AUTH_ROLES = ["client", "vendor", "admin", "collaborateur"] as const

export type AuthRole = (typeof AUTH_ROLES)[number]

export const AUTH_ROLE_ADDITIONAL_FIELD = {
  type: "string",
  required: false,
  defaultValue: "client",
  input: false,
} as const

export type PublicSignupRole = "client" | "vendor"

export function normalizePublicSignupRole(value: unknown): PublicSignupRole {
  return value === "vendor" ? "vendor" : "client"
}

export const ADMIN_EMAIL_CHANGE_ERROR =
  "L'adresse email ne peut pas être modifiée depuis l'administration. Utilisez un flux de confirmation sécurisé."

export function isSameAdminEmail(
  existingEmail: string,
  requestedEmail: unknown
): boolean {
  if (typeof requestedEmail !== "string") return false

  return (
    existingEmail.trim().toLowerCase() ===
    requestedEmail.trim().toLowerCase()
  )
}

/**
 * Les permissions d'un collaborateur ne doivent jamais survivre à une
 * rétrogradation. Une nouvelle promotion exigera une attribution explicite.
 */
export function shouldClearCollaboratorPermissions(
  previousRole: string | null | undefined,
  nextRole: string | null | undefined
): boolean {
  return (
    previousRole === "collaborateur" &&
    nextRole !== undefined &&
    nextRole !== "collaborateur"
  )
}

export type OtpVisibilityState =
  | "unknown"
  | "already_verified"
  | "cooldown"
  | "sent"

export const OTP_SEND_ACCEPTED_RESPONSE = { ok: true } as const

/**
 * La réponse publique reste identique pour une adresse inconnue, déjà
 * vérifiée ou encore sous cooldown. Elle ne révèle donc pas l'existence du
 * compte et ne fournit pas de délai exploitable par un attaquant.
 */
export function getOtpSendPublicResponse(state: OtpVisibilityState): {
  status: 200
  body: typeof OTP_SEND_ACCEPTED_RESPONSE
} {
  void state
  return {
    status: 200,
    body: OTP_SEND_ACCEPTED_RESPONSE,
  }
}

export const ROLE_DASHBOARD_PATHS: Record<AuthRole, string> = {
  client: "/dashboard/client",
  vendor: "/dashboard/vendeur",
  admin: "/dashboard/admin",
  collaborateur: "/dashboard/collaborateur",
}

/**
 * Route canonique des résultats. Les tableaux de bord ont une page de
 * résultats dans leur propre segment afin de conserver leur navigation, mais
 * tous réutilisent le même composant et la même source de données.
 */
export const RESULTS_PATH = "/resultats-recherche"

/** @deprecated Utiliser `RESULTS_PATH`. */
export const CLIENT_RESULTS_PATH = RESULTS_PATH

export const RESULTS_PATHS: Record<AuthRole, string> = {
  client: RESULTS_PATH,
  vendor: "/dashboard/vendeur/resultats-recherche",
  admin: "/dashboard/admin/resultats-recherche",
  collaborateur: "/dashboard/collaborateur/resultats-recherche",
}

/** Destination des résultats adaptée au rôle connecté. */
export function getResultsPathForRole(role: string | null | undefined): string {
  return role === "vendor" || role === "admin" || role === "collaborateur"
    ? RESULTS_PATHS[role]
    : RESULTS_PATH
}

/**
 * Retourne uniquement une destination interne autorisée après connexion.
 * Les URL externes, les chemins protocolaires et les destinations ambiguës
 * sont ignorées afin de ne jamais créer une open redirect.
 */
export function getSafeInternalRedirect(value: unknown): string | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("/") ||
    value.startsWith("//") ||
    value.includes("\\") ||
    /[\r\n]/.test(value)
  ) {
    return null
  }

  try {
    const base = new URL("https://gazpoints.local")
    const parsed = new URL(value, base)
    if (parsed.origin !== base.origin) return null

    const isDashboardPath =
      parsed.pathname === "/dashboard" || parsed.pathname.startsWith("/dashboard/")
    const isResultsPath = parsed.pathname === CLIENT_RESULTS_PATH
    if (!isDashboardPath && !isResultsPath) return null

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return null
  }
}

export type AccountAccessStatus =
  | "ready"
  | "unauthenticated"
  | "inactive"
  | "unverified"
  | "invalid_role"
  | "account_missing"
  | "session_error"

export type AuthAccountRecord = {
  id: string
  role: string | null
  emailVerified: boolean
  isActive: boolean
  mustChangePassword?: boolean | null
}

export type AccountAccessDecision = {
  status: AccountAccessStatus
  role?: AuthRole
  redirectTo?: string
  account?: AuthAccountRecord
}

export type DashboardArea =
  | "root"
  | "client"
  | "vendor"
  | "admin"
  | "collaborateur"
  | "depot"
  | "shared"

export const ACCOUNT_ACCESS_ERROR_CODES: Partial<
  Record<AccountAccessStatus, string>
> = {
  inactive: "account_inactive",
  unverified: "account_unverified",
  invalid_role: "invalid_role",
  account_missing: "account_missing",
  session_error: "session_error",
}

export const ACCOUNT_ACCESS_MESSAGES: Record<string, string> = {
  account_inactive: "Ce compte est désactivé. Contactez le support.",
  account_unverified: "Vérifiez votre adresse email avant de continuer.",
  invalid_role: "Ce compte ne possède aucun rôle valide.",
  account_missing: "Ce compte est introuvable.",
  session_error: "La session ne peut pas être vérifiée. Réessayez.",
  staff_required: "Ce canal est réservé aux administrateurs et collaborateurs.",
  unauthenticated: "Vous devez vous connecter pour continuer.",
}

export function isAuthRole(value: unknown): value is AuthRole {
  return (
    typeof value === "string" &&
    (AUTH_ROLES as readonly string[]).includes(value)
  )
}

export function isStaffRole(value: unknown): value is "admin" | "collaborateur" {
  return value === "admin" || value === "collaborateur"
}

export function getRoleDashboardPath(
  role: AuthRole,
  mustChangePassword = false
): string {
  if (role === "collaborateur" && mustChangePassword) {
    return "/mot-de-passe-temporaire"
  }
  return ROLE_DASHBOARD_PATHS[role]
}

export function evaluateAccountAccess(
  account: AuthAccountRecord | null | undefined
): AccountAccessDecision {
  if (!account) {
    return { status: "account_missing" }
  }
  if (account.isActive === false) {
    return { status: "inactive", account }
  }
  if (account.emailVerified !== true) {
    return { status: "unverified", account }
  }
  if (!isAuthRole(account.role)) {
    return { status: "invalid_role", account }
  }

  return {
    status: "ready",
    role: account.role,
    redirectTo: getRoleDashboardPath(
      account.role,
      account.mustChangePassword === true
    ),
    account,
  }
}

export function classifyDashboardPath(pathname: string): DashboardArea | null {
  if (pathname === "/dashboard") return "root"
  if (pathname === "/dashboard/client") return "client"
  if (
    pathname === "/dashboard/vendeur" ||
    pathname === "/dashboard/pro"
  ) {
    return "vendor"
  }
  if (pathname.startsWith("/dashboard/vendeur/")) return "vendor"
  if (
    pathname === "/dashboard/reservations/vendor" ||
    pathname === "/dashboard/reservations/verify" ||
    pathname.startsWith("/dashboard/reservations/vendor/")
  ) {
    return "vendor"
  }
  if (
    pathname === "/dashboard/admin" ||
    pathname.startsWith("/dashboard/admin/")
  ) {
    return "admin"
  }
  if (
    pathname === "/dashboard/collaborateur" ||
    pathname.startsWith("/dashboard/collaborateur/")
  ) {
    return "collaborateur"
  }
  if (
    pathname === "/dashboard/depot" ||
    pathname.startsWith("/dashboard/depot/")
  ) {
    return "depot"
  }
  if (pathname.startsWith("/dashboard/")) return "shared"
  return null
}

export function resolveDashboardAccess(
  pathname: string,
  role: AuthRole,
  mustChangePassword = false
): { allowed: boolean; redirectTo?: string } {
  const area = classifyDashboardPath(pathname)
  if (!area) return { allowed: true }

  const destination = getRoleDashboardPath(role, mustChangePassword)
  if (mustChangePassword && role === "collaborateur") {
    return { allowed: false, redirectTo: destination }
  }

  if (area === "root") {
    return { allowed: false, redirectTo: destination }
  }

  if (area === "client") {
    return role === "client"
      ? { allowed: true }
      : { allowed: false, redirectTo: destination }
  }

  if (area === "vendor") {
    return role === "vendor"
      ? { allowed: true }
      : { allowed: false, redirectTo: destination }
  }

  if (area === "collaborateur") {
    return role === "collaborateur"
      ? { allowed: true }
      : { allowed: false, redirectTo: destination }
  }

  if (area === "admin") {
    if (role === "admin" || role === "collaborateur") {
      return { allowed: true }
    }
    return { allowed: false, redirectTo: destination }
  }

  if (area === "depot") {
    return role === "vendor"
      ? { allowed: true }
      : { allowed: false, redirectTo: destination }
  }

  return { allowed: true }
}

/**
 * Contrôle serveur de la page de résultats : tout compte authentifié peut
 * consulter ses recherches. Le shell adapté au rôle est fourni par la route
 * correspondante, sans modifier les navigations des tableaux de bord.
 */
export function resolveClientResultsAccess(
  role: AuthRole | undefined
): { allowed: boolean; redirectTo?: string } {
  if (role === "client") {
    return { allowed: true }
  }
  return {
    allowed: false,
    redirectTo: role ? ROLE_DASHBOARD_PATHS[role] : ROLE_DASHBOARD_PATHS.client,
  }
}

/**
 * Autorisation élargie : tout compte authentifié peut accéder à sa page
 * de résultats dans son propre segment dashboard. Utilisé par le proxy
 * et les nouvelles routes role-specific.
 */
export function resolveResultsAccess(
  role: AuthRole | undefined
): { allowed: boolean; redirectTo?: string } {
  if (role && AUTH_ROLES.includes(role)) {
    return { allowed: true }
  }
  return { allowed: false, redirectTo: ROLE_DASHBOARD_PATHS.client }
}
