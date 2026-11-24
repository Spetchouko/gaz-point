export default function DepotLoading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Chargement du dépôt">
      <div className="h-7 w-52 animate-pulse rounded bg-muted" />
      <div className="h-4 w-80 max-w-full animate-pulse rounded bg-muted/60" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-lg border border-border bg-muted/40" />
        <div className="h-72 animate-pulse rounded-lg border border-border bg-muted/40" />
      </div>
    </div>
  )
}
