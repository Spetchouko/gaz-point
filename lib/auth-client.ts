import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined" ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
})

/**
 * Force refresh the session from the server.
 * Useful after profile/avatar updates to immediately reflect changes.
 */
export async function refreshSession() {
  await authClient.$fetch("/session", { method: "GET" })
}