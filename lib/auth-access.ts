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

/**
 * Wrapper avec timeout pour chaque tentative de requête DB.
 */
async function withTimeoutPerAttempt<T>(
  operation: () => Promise<T>,
  ms: number
): Promise<T> {
  return Promise.race([
    operation(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timeout après ${ms}ms`)), ms)
    ),
  ])
}

export async function loadAuthAccountById(
  userId: string
): Promise<AuthAccountRecord | null> {
  const [account] = await withTransientRetry(async () =>
    withTimeoutPerAttempt(
      () =>
        db
          .select({
            id: user.id,
            role: user.role,
            emailVerified: user.emailVerified,
            isActive: user.isActive,
            mustChangePassword: user.mustChangePassword,
          })
          .from(user)
          .where(eq(user.id, userId))
          .limit(1),
      10000
    ),
    { attempts: 3, delayMs: 250 }
  )

  return account ?? null
}

export async function getAuthenticatedAccountAccess(
  requestHeaders: Headers,
  loadAccount: AuthAccountLoader = loadAuthAccountById
): Promise<AccountAccessDecision> {
  try {
    // Une erreur réseau transitoire ne doit pas être traitée comme une session
    // invalide : elle redirigerait vers /connexion un utilisateur connecté.
    const session = await withTransientRetry(async () =>
      withTimeoutPerAttempt(
        () => auth.api.getSession({ headers: requestHeaders }),
        10000
      ),
      { attempts: 3, delayMs: 250 }
    )
    const userId = session?.user?.id
    if (!userId) {
      return { status: "unauthenticated" }
    }

    const account = await loadAccount(userId)
    return evaluateAccountAccess(account)
  } catch {
    return { status: "session_error" }
  }
}
