import { Metadata } from "next"
import { db } from "@/db"
import { user } from "@/db/schema"
import { count, eq, desc, ilike, or, sql, and } from "drizzle-orm"
import { AdminUsersTable } from "@/app/_components/admin-users-table"
import { AdminSearchFilters } from "@/app/_components/admin-search-filters"
import { ExportUsersButton } from "@/app/admin/users/ExportUsersButton"

export const metadata: Metadata = {
  title: { absolute: "Utilisateurs | Administration GazPoint" },
}

const ITEMS_PER_PAGE = 50

type SearchParams = {
  q?: string
  status?: "all" | "active" | "inactive"
  sort?: "recent" | "oldest"
  page?: string
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const { q, status = "all", sort = "recent", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const offset = (pageNum - 1) * ITEMS_PER_PAGE

  const whereConditions = []

  if (q) {
    whereConditions.push(
      or(
        ilike(user.name, `%${q}%`),
        ilike(user.email, `%${q}%`),
        ilike(user.phoneNumber, `%${q}%`)
      )
    )
  }

  if (status === "active") {
    whereConditions.push(or(eq(user.role, "vendor"), eq(user.role, "admin")))
  } else if (status === "inactive") {
    whereConditions.push(eq(user.role, "client"))
  }

  const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined

  const orderClause = sort === "oldest" ? user.createdAt : desc(user.createdAt)

  const [users, totalResult] = await Promise.all([
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

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Utilisateurs</h1>
          <p className="mt-2 text-muted-foreground">
            Gestion des comptes utilisateurs de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ExportUsersButton />
        </div>
      </header>

      <AdminSearchFilters
        searchValue={q ?? ""}
        statusValue={status}
        sortValue={sort}
        statusOptions={[
          { value: "all", label: "Tous" },
          { value: "active", label: "Actifs (vendeurs + admin)" },
          { value: "inactive", label: "Inactifs (clients)" },
        ]}
        sortOptions={[
          { value: "recent", label: "Plus récents" },
          { value: "oldest", label: "Plus anciens" },
        ]}
      />

      <AdminUsersTable users={users} />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          {pageNum > 1 && (
            <a
              href={`?${new URLSearchParams({ ...{ q, status, sort }, page: String(pageNum - 1) }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Précédent
            </a>
          )}
          <span className="px-3 py-2 text-sm text-muted-foreground">
            Page {pageNum} / {totalPages} — {total} utilisateur{total > 1 ? "s" : ""}
          </span>
          {pageNum < totalPages && (
            <a
              href={`?${new URLSearchParams({ ...{ q, status, sort }, page: String(pageNum + 1) }).toString()}`}
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