export default function AvisLoading() {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-4" aria-busy="true" aria-label="Chargement">
      <div className="h-7 w-48 animate-pulse rounded bg-muted" />
      <div className="h-4 w-72 max-w-full animate-pulse rounded bg-muted/60" />
      <div className="space-y-3 rounded-lg border border-border p-4">
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-24 animate-pulse rounded bg-muted/60" />
        <div className="h-8 w-40 animate-pulse rounded bg-muted/60" />
      </div>
    </div>
  )
}
