import { Metadata } from "next"
import { db } from "@/db"
import { user, collaborateurPermission } from "@/db/schema"
import { count, desc, ilike, or, and, inArray, type SQL } from "drizzle-orm"
import { AdminCollaborateursTable } from "@/app/_components/admin-collaborateurs-table"
import { AdminCollaborateurForm } from "@/app/_components/admin-collaborateur-form"
import { AdminSearchFilters } from "@/app/_components/admin-search-filters"
import { requireAdmin } from "@/lib/session"
import { ExportCollaborateursButton } from "./ExportCollaborateursButton"

export const metadata: Metadata = {
  title: { absolute: "Collaborateurs administrateurs | Administration GAZ POINT" },
}

const ITEMS_PER_PAGE = 50

type CollaborateurPermissionModule =
  | "utilisateurs"
  | "vendeurs"
  | "disponibilites"
  | "marketing"
  | "statistiques"

type SearchParams = {
  q?: string
  status?: "all" | "active" | "inactive"
  sort?: "recent" | "oldest"
  page?: string
}

export default async function AdminCollaborateursPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireAdmin()

  const { q, status = "all", sort = "recent", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const offset = (pageNum - 1) * ITEMS_PER_PAGE

  const whereConditions: (SQL | undefined)[] = [
    inArray(user.role, ["admin", "collaborateur"]),
  ]

  if (q) {
    whereConditions.push(
      or(
        ilike(user.name, `%${q}%`),
        ilike(user.email, `%${q}%`),
        ilike(user.phoneNumber, `%${q}%`)
      )
    )
  }

  const whereClause = and(...whereConditions)

  const orderClause = sort === "oldest" ? user.createdAt : desc(user.createdAt)

  const [collaborateurs, totalResult] = await Promise.all([
    db
      .select()
      .from(user)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(ITEMS_PER_PAGE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(user)
      .where(whereClause),
  ])

  const ids = collaborateurs.map((c) => c.id)
  const permissionRows =
    ids.length > 0
      ? await db
          .select()
          .from(collaborateurPermission)
          .where(inArray(collaborateurPermission.collaboratorId, ids))
      : []
  const permissionsMap = new Map<string, string[]>()
  for (const row of permissionRows) {
    const existing = permissionsMap.get(row.collaboratorId) ?? []
    existing.push(row.module)
    permissionsMap.set(row.collaboratorId, existing)
  }

  const collaborateursWithPermissions = collaborateurs.map((c) => ({
    ...c,
    permissions: (permissionsMap.get(c.id) ?? []) as CollaborateurPermissionModule[],
  }))

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Collaborateurs administrateurs</h1>
          <p className="mt-2 text-muted-foreground">
            Gestion des comptes administrateurs et collaborateurs
          </p>
        </div>
        <div className="flex items-center gap-2">
          <AdminCollaborateurForm />
          <ExportCollaborateursButton />
        </div>
      </header>

      <AdminSearchFilters
        searchValue={q ?? ""}
        statusValue={status}
        sortValue={sort}
        statusOptions={[{ value: "all", label: "Tous" }]}
        sortOptions={[
          { value: "recent", label: "Plus récents" },
          { value: "oldest", label: "Plus anciens" },
        ]}
      />

      <AdminCollaborateursTable collaborateurs={collaborateursWithPermissions} />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          {pageNum > 1 && (
            <a
              href={`?${new URLSearchParams({ ...{ q: q ?? "", status, sort }, page: String(pageNum - 1) }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Précédent
            </a>
          )}
          <span className="px-3 py-2 text-sm text-muted-foreground">
            Page {pageNum} / {totalPages} — {total} collaborateur{total > 1 ? "s" : ""}
          </span>
          {pageNum < totalPages && (
            <a
              href={`?${new URLSearchParams({ ...{ q: q ?? "", status, sort }, page: String(pageNum + 1) }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Suivant
            </a>
          )}
        </nav>
      )}
    </div>
  )
}