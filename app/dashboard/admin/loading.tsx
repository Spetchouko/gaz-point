export default function AdminLoading() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Chargement du tableau de bord administrateur">
      <div className="space-y-2">
        <div className="admin-skeleton h-7 w-64 rounded" />
        <div className="admin-skeleton h-4 w-96 max-w-full rounded" />
      </div>

      <div className="admin-grid admin-grid--4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="admin-card p-4">
            <div className="admin-skeleton mb-3 size-9 rounded-xl" />
            <div className="admin-skeleton mb-2 h-7 w-20 rounded" />
            <div className="admin-skeleton h-3 w-28 rounded" />
          </div>
        ))}
      </div>

      <div className="admin-card p-4">
        <div className="admin-skeleton mb-4 h-5 w-48 rounded" />
        <div className="admin-skeleton h-64 w-full rounded-lg" />
      </div>
    </div>
  );
}
