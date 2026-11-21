import { headers } from "next/headers"
import { Suspense } from "react"
import { redirect } from "next/navigation"
import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { getAuthenticatedAccountAccess } from "@/lib/auth-access"
import {
  CLIENT_RESULTS_PATH,
  resolveClientResultsAccess,
} from "@/lib/auth-routing"
import type { DashboardUser } from "@/lib/auth-session"
import { DashboardClientLayout } from "@/app/_components/dashboard/client-layout"
import { ResultatsRecherche } from "@/app/_components/resultats-recherche"

export const metadata: Metadata = {
  title: "Résultats de votre recherche | GazPoints",
  description:
    "Consultez les points de vente correspondant à votre recherche de bouteille de gaz et leur disponibilité en direct.",
}

export const dynamic = "force-dynamic"

type RawSearchParams = Record<string, string | string[] | undefined>

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

function currentResultsPath(params: RawSearchParams): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    const normalized = firstValue(value)
    if (normalized) query.set(key, normalized)
  }
  const serialized = query.toString()
  return serialized ? `${CLIENT_RESULTS_PATH}?${serialized}` : CLIENT_RESULTS_PATH
}

function loginRedirect(params: RawSearchParams): string {
  return `/connexion?redirect=${encodeURIComponent(currentResultsPath(params))}`
}

/**
 * Page native de l'espace client : la coquille du dashboard est rendue ici,
 * et l'accès est vérifié côté serveur avant tout rendu.
 */
export default async function ResultatsRecherchePage({
  searchParams,
}: {
  searchParams: Promise<RawSearchParams>
}) {
  const params = await searchParams
  const requestHeaders = await headers()
  const access = await getAuthenticatedAccountAccess(requestHeaders)

  if (access.status !== "ready" || !access.role) {
    redirect(loginRedirect(params))
  }

  const roleDecision = resolveClientResultsAccess(access.role)
  if (!roleDecision.allowed) {
    redirect(roleDecision.redirectTo ?? "/dashboard/client")
  }

  const session = await auth.api.getSession({ headers: requestHeaders })
  const sessionUser = session?.user
  if (!sessionUser) {
    redirect(loginRedirect(params))
  }

  const extra = sessionUser as {
    image?: string | null
    role?: string | null
    phoneNumber?: string | null
    isActive?: boolean | null
    mustChangePassword?: boolean | null
    createdAt?: Date | string | null
    lastLoginAt?: Date | string | null
  }

  const user: DashboardUser = {
    id: sessionUser.id,
    name: sessionUser.name ?? null,
    email: sessionUser.email ?? null,
    image: extra.image ?? null,
    role: extra.role ?? null,
    emailVerified: sessionUser.emailVerified ?? null,
    isActive: extra.isActive ?? null,
    phoneNumber: extra.phoneNumber ?? null,
    createdAt: extra.createdAt ?? null,
    lastLoginAt: extra.lastLoginAt ?? null,
    mustChangePassword: extra.mustChangePassword ?? null,
  }

  return (
    <DashboardClientLayout session={user} status="authenticated">
      <Suspense
        fallback={
          <div className="rounded-2xl border border-border bg-card px-4 py-12 text-center text-sm text-muted-foreground shadow-sm">
            Chargement des résultats…
          </div>
        }
      >
        <ResultatsRecherche />
      </Suspense>
    </DashboardClientLayout>
  )
}
