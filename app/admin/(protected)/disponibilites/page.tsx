import { Metadata } from "next"
import { db } from "@/db"
import { user, pointDeVente, disponibilite, brand } from "@/db/schema"
import { count, eq, desc, ilike, or, and } from "drizzle-orm"
import { AdminDisponibilitesBoard } from "@/app/_components/admin-disponibilites-board"
import { AdminSearchFilters } from "@/app/_components/admin-search-filters"
import { AdminSourceFilter } from "@/app/_components/admin-source-filter"
import { requireStaffModule } from "@/lib/session"
import { ExportDisponibilitesButton } from "@/app/admin/dispos-export/ExportDisponibilitesButton"

export const metadata: Metadata = {
  title: { absolute: "Disponibilités | Administration GAZ POINT" },
}

const ITEMS_PER_PAGE = 50

type SearchParams = {
  q?: string
  status?: "all" | "disponible" | "indisponible" | "a_confirmer"
  source?: "all" | "vendeur" | "administration"
  sort?: "recent" | "oldest"
  page?: string
}

export default async function AdminDisponibilitesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  await requireStaffModule("disponibilites")

  const { q, status = "all", source = "all", sort = "recent", page = "1" } = await searchParams
  const pageNum = Math.max(1, parseInt(page, 10))
  const offset = (pageNum - 1) * ITEMS_PER_PAGE

  const [points, vendors, brandRows] = await Promise.all([
    db.select().from(pointDeVente).orderBy(desc(pointDeVente.createdAt)),
    db
      .select({ id: user.id, name: user.name, email: user.email })
      .from(user)
      .where(eq(user.role, "vendor")),
    db.select({ name: brand.name }).from(brand).orderBy(brand.name),
  ])

  const pointMap = new Map(points.map((p) => [p.id, p]))
  const vendorMap = new Map(vendors.map((v) => [v.id, v]))

  const whereConditions = []

  if (q) {
    whereConditions.push(
      or(
        ilike(disponibilite.format, `%${q}%`),
        ilike(disponibilite.note, `%${q}%`),
        ilike(disponibilite.phone, `%${q}%`),
        ilike(disponibilite.brand, `%${q}%`)
      )
    )
  }

  if (status !== "all") {
    whereConditions.push(eq(disponibilite.status, status))
  }

  if (source !== "all") {
    whereConditions.push(eq(disponibilite.source, source))
  }

  const whereClause = and(...whereConditions)

  const orderClause = sort === "oldest" ? disponibilite.createdAt : desc(disponibilite.createdAt)

  const [dispos, totalResult] = await Promise.all([
    db
      .select()
      .from(disponibilite)
      .where(whereClause)
      .orderBy(orderClause)
      .limit(ITEMS_PER_PAGE)
      .offset(offset),
    db
      .select({ count: count() })
      .from(disponibilite)
      .where(whereClause),
  ])

  const total = totalResult[0]?.count ?? 0
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE)

  const disposWithData = dispos.map((d) => {
    const point = pointMap.get(d.pointId)
    const vendor = point?.vendorId ? vendorMap.get(point.vendorId) : null
    return {
      ...d,
      pointName: point?.name ?? "—",
      pointDistrict: point?.district ?? "—",
      pointAddress: point?.address ?? "—",
      vendorName: vendor?.name ?? "—",
      vendorEmail: vendor?.email ?? "—",
      vendorId: vendor?.id ?? "",
    }
  })

  const pointOptions = points.map((p) => ({
    id: p.id,
    name: p.name,
    district: p.district,
    vendorName: p.vendorId ? vendorMap.get(p.vendorId)?.name ?? "—" : "—",
  }))

  const brandNames = brandRows.map((b) => b.name)

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Disponibilités</h1>
        <p className="mt-2 text-muted-foreground">
          Toutes les disponibilités publiées par les vendeurs et l&apos;administration
        </p>
      </header>

      <ExportDisponibilitesButton />

      <AdminSearchFilters
        searchValue={q ?? ""}
        statusValue={status}
        sortValue={sort}
        statusOptions={[
          { value: "all", label: "Tous statuts" },
          { value: "disponible", label: "Disponible" },
          { value: "indisponible", label: "Indisponible" },
          { value: "a_confirmer", label: "À confirmer" },
        ]}
        sortOptions={[
          { value: "recent", label: "Plus récentes" },
          { value: "oldest", label: "Plus anciennes" },
        ]}
        extraFilters={
          <AdminSourceFilter
            q={q ?? ""}
            status={status}
            source={source}
            sort={sort}
          />
        }
      />

      <AdminDisponibilitesBoard dispos={disposWithData} points={pointOptions} brands={brandNames} />

      {totalPages > 1 && (
        <nav className="flex items-center justify-center gap-2" aria-label="Pagination">
          {pageNum > 1 && (
            <a
              href={`?${new URLSearchParams({ ...{ q: q ?? "", status, source, sort }, page: String(pageNum - 1) }).toString()}`}
              className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg hover:bg-muted transition-colors"
            >
              Précédent
            </a>
          )}
          <span className="px-3 py-2 text-sm text-muted-foreground">
            Page {pageNum} / {totalPages} — {total} disponibilité{total > 1 ? "s" : ""}
          </span>
          {pageNum < totalPages && (
            <a
              href={`?${new URLSearchParams({ ...{ q: q ?? "", status, source, sort }, page: String(pageNum + 1) }).toString()}`}
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