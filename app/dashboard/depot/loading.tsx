export default function DepotLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement">
      <div className="h-7 w-56 animate-pulse rounded bg-muted" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/60" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-lg border border-border bg-muted/40"
          />
        ))}
      </div>
      <div className="space-y-3 rounded-lg border border-border p-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-10 animate-pulse rounded bg-muted/60" />
        ))}
      </div>
    </div>
  )
}
