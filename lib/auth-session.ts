"use client"

import { authClient, useRefreshSession } from "@/lib/auth-client"
import { useEffect, useRef } from "react"

export const DASHBOARD_PERMISSION_KEYS = [
  "utilisateurs",
  "clients",
  "vendeurs",
  "disponibilites",
  "reservations",
  "publicite",
  "collaborateurs",
  "marketing",
  "avis",
  "statistiques",
  "abonnements",
] as const

export type DashboardPermission = (typeof DASHBOARD_PERMISSION_KEYS)[number]
export type DashboardRole = "client" | "vendor" | "admin" | "collaborateur"

export interface DashboardUser {
  id: string
  name: string | null
  email: string | null
  image: string | null
  role: string | null
  emailVerified: boolean | null
  isActive: boolean | null
  phoneNumber: string | null
  createdAt: Date | string | null
  lastLoginAt: Date | string | null
  mustChangePassword: boolean | null
}

export interface DashboardSession {
  status: "loading" | "authenticated" | "unauthenticated"
  user: DashboardUser | null
  isAuthenticated: boolean
  isLoading: boolean
  role: DashboardRole | null
  isAdmin: boolean
  isCollaborateur: boolean
  isVendor: boolean
  isClient: boolean
  permissions: Set<DashboardPermission>
}

type BetterAuthSession = ReturnType<typeof authClient.useSession>
type BetterAuthSessionData = NonNullable<BetterAuthSession["data"]>

/**
 * Session Better Auth augmentée des champs additionnels configurés dans
 * lib/auth.ts, sans les exposer au client comme des valeurs de contrôle.
 */
export type SafeSessionUser = BetterAuthSessionData["user"] & {
  role?: string | null
  phoneNumber?: string | null
  phoneVerified?: boolean | null
  phoneNumberVerified?: boolean | null
  isActive?: boolean | null
  mustChangePassword?: boolean | null
  lastLoginAt?: Date | string | null
  createdAt?: Date | string | null
}

export type SafeSession = Omit<BetterAuthSession, "data"> & {
  data: (Omit<BetterAuthSessionData, "user"> & { user: SafeSessionUser }) | null
}

/**
 * Hook qui appelle authClient.useSession() au niveau supérieur.
 * Better Auth gère le rendu serveur et l'état pending du premier rendu.
 */
export function useSafeSession(): SafeSession {
  return authClient.useSession() as SafeSession
}

/**
 * Hook pour forcer le rafraîchissement de la session depuis le serveur.
 * Utile après mise à jour du profil/avatar pour refléter immédiatement les changements.
 */
export { useRefreshSession }

/**
 * Hook pour rafraîchir automatiquement la session quand la fenêtre retrouve le focus.
 * Utile si l'utilisateur a mis à jour son profil dans un autre onglet.
 * @param enabled - Activer/désactiver le rafraîchissement automatique (défaut: true)
 * @param debounceMs - Délai anti-rebond en ms pour éviter les rafraîchissements excessifs (défaut: 2000ms)
 */
export function useAutoRefreshSession(enabled = true, debounceMs = 2000) {
  const lastRefreshRef = useRef<number>(0)
  const refreshSession = useRefreshSession()

  useEffect(() => {
    if (!enabled) return

    const handleFocus = () => {
      const now = Date.now()
      if (now - lastRefreshRef.current >= debounceMs) {
        lastRefreshRef.current = now
        void refreshSession().catch(() => undefined)
      }
    }

    window.addEventListener("focus", handleFocus)
    return () => window.removeEventListener("focus", handleFocus)
  }, [enabled, debounceMs, refreshSession])
}

/**
 * Hook centralisé de session pour les dashboards.
 *
 * Ce hook ne déclenche aucune redirection. La protection des routes est
 * gérée côté serveur par le Proxy Next.js. Les permissions d'un collaborateur
 * sont chargées séparément depuis l'API protégée qui vérifie son rôle.
 */
export function useDashboardSession(): DashboardSession {
  const { data: session, isPending } = useSafeSession()
  const user = session?.user ?? null

  const rawRole = user?.role ?? null
  const role: DashboardRole | null = user
    ? rawRole === "admin" ||
        rawRole === "collaborateur" ||
        rawRole === "vendor" ||
        rawRole === "client"
      ? rawRole
      : null
    : null

  const isAdmin = role === "admin"
  const isCollaborateur = role === "collaborateur"
  const isVendor = role === "vendor"
  const isClient = role === "client"
  const isAuthenticated = Boolean(user)
  const isLoading = isPending

  const status: "loading" | "authenticated" | "unauthenticated" = isLoading
    ? "loading"
    : isAuthenticated
      ? "authenticated"
      : "unauthenticated"

  const permissions = new Set<DashboardPermission>(
    isAdmin ? DASHBOARD_PERMISSION_KEYS : []
  )

  return {
    status,
    user: user
      ? {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image ?? null,
          role: user.role ?? null,
          emailVerified: user.emailVerified,
          isActive: user.isActive ?? null,
          phoneNumber: user.phoneNumber ?? null,
          createdAt: user.createdAt ?? null,
          lastLoginAt: user.lastLoginAt ?? null,
          mustChangePassword: user.mustChangePassword ?? null,
        }
      : null,
    isAuthenticated,
    isLoading,
    role,
    isAdmin,
    isCollaborateur,
    isVendor,
    isClient,
    permissions,
  }
}
