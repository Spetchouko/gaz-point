import { eq } from "drizzle-orm"
import { db } from "@/db"
import { user } from "@/db/schema"
import { auth } from "@/lib/auth"
import {
  evaluateAccountAccess,
  type AccountAccessDecision,
  type AuthAccountRecord,
} from "@/lib/auth-routing"
import { withTransientRetry } from "@/lib/transient-retry"

export type AuthAccountLoader = (
  userId: string
) => Promise<AuthAccountRecord | null>

export async function loadAuthAccountById(
  userId: string
): Promise<AuthAccountRecord | null> {
  const [account] = await db
    .select({
      id: user.id,
      role: user.role,
      emailVerified: user.emailVerified,
      isActive: user.isActive,
      mustChangePassword: user.mustChangePassword,
    })
    .from(user)
    .where(eq(user.id, userId))
    .limit(1)

  return account ?? null
}

export async function getAuthenticatedAccountAccess(
  requestHeaders: Headers,
  loadAccount: AuthAccountLoader = loadAuthAccountById
): Promise<AccountAccessDecision> {
  try {
    // Une erreur réseau transitoire ne doit pas être traitée comme une session
    // invalide : elle redirigerait vers /connexion un utilisateur connecté.
    const session = await withTransientRetry(() =>
      auth.api.getSession({ headers: requestHeaders })
    )
    const userId = session?.user?.id
    if (!userId) {
      return { status: "unauthenticated" }
    }

    const account = await withTransientRetry(() => loadAccount(userId))
    return evaluateAccountAccess(account)
  } catch {
    return { status: "session_error" }
  }
}
