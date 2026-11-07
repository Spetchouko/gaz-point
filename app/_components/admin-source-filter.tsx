"use client"

export function AdminSourceFilter({
  q,
  status,
  source,
  sort,
}: {
  q: string
  status: string
  source: string
  sort: string
}) {
  return (
    <select
      value={source}
      onChange={(e) => {
        const params = new URLSearchParams({
          q,
          status,
          source: e.target.value,
          sort,
          page: "1",
        })
        window.location.search = params.toString()
      }}
      className="h-10 px-3 rounded-lg border bg-background text-sm"
      aria-label="Filtrer par source"
    >
      <option value="all">Toutes sources</option>
      <option value="vendeur">Vendeur</option>
      <option value="administration">Administration</option>
    </select>
  )
}
