export default function VendorLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement">
      <div className="h-7 w-56 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted/60" />
      <div className="grid gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="h-24 animate-pulse rounded-lg border border-border bg-muted/40"
          />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="h-64 animate-pulse rounded-lg border border-border bg-muted/40" />
        <div className="h-64 animate-pulse rounded-lg border border-border bg-muted/40 lg:col-span-2" />
      </div>
    </div>
  )
}
