"use client"

import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
})

/**
 * Rafraîchit la session Better Auth depuis le serveur. Le hook doit être
 * utilisé dans un composant React, car Better Auth expose cette action via
 * useSession().refetch.
 */
export function useRefreshSession() {
  const { refetch } = authClient.useSession()
  return refetch
}