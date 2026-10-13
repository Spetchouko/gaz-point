"use client"

import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { approveAvis, deleteAvis, hideAvis, rejectAvis } from "@/app/admin/actions"
import {
  AdminAvisTable,
  type AvisActionKind,
  type AvisRow,
} from "@/app/_components/admin-avis-table"
import { AVIS_STATUSES, AVIS_STATUS_LABELS, type AvisStatus } from "@/lib/avis-shared"
import { cn } from "@/lib/utils"

const actionFns = {
  approve: approveAvis,
  reject: rejectAvis,
  hide: hideAvis,
  delete: deleteAvis,
} as const

const actionCopy: Record<
  AvisActionKind,
  { title: string; description: string; confirm: string; destructive?: boolean }
> = {
  approve: {
    title: "Approuver cet avis ?",
    description: "Il sera immédiatement visible sur la page d'accueil.",
    confirm: "Approuver",
  },
  reject: {
    title: "Refuser cet avis ?",
    description: "Il ne sera jamais publié sur le site.",
    confirm: "Refuser",
  },
  hide: {
    title: "Masquer cet avis ?",
    description: "Il ne sera plus affiché, sans être supprimé.",
    confirm: "Masquer",
  },
  delete: {
    title: "Supprimer cet avis ?",
    description: "Cette action est définitive.",
    confirm: "Supprimer",
    destructive: true,
  },
}

export function AdminAvisBoard({ avis }: { avis: AvisRow[] }) {
  const [filter, setFilter] = useState<AvisStatus | "all">("all")
  const [target, setTarget] = useState<{ row: AvisRow; kind: AvisActionKind } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(
    () => (filter === "all" ? avis : avis.filter((item) => item.status === filter)),
    [avis, filter]
  )

  const confirm = async () => {
    if (!target) return
    setError(null)
    const formData = new FormData()
    formData.set("avisId", target.row.id)
    const result = await actionFns[target.kind](null, formData)
    if (result.ok) setTarget(null)
    else setError(result.message)
  }

  const filters: Array<{ value: AvisStatus | "all"; label: string }> = [
    { value: "all", label: "Toutes" },
    ...AVIS_STATUSES.map((status) => ({
      value: status as AvisStatus | "all",
      label: AVIS_STATUS_LABELS[status],
    })),
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {filters.map((item) => {
          const count =
            item.value === "all"
              ? avis.length
              : avis.filter((row) => row.status === item.value).length
          const active = filter === item.value
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => setFilter(item.value)}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {item.label}
              <span className="text-xs opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      <AdminAvisTable
        avis={filtered}
        onAction={(row, kind) => {
          setError(null)
          setTarget({ row, kind })
        }}
      />

      <Dialog open={target !== null} onOpenChange={() => setTarget(null)}>
        <DialogContent className="sm:max-w-md">
          {target && (
            <>
              <DialogHeader>
                <DialogTitle>{actionCopy[target.kind].title}</DialogTitle>
                <DialogDescription>
                  {actionCopy[target.kind].description}
                </DialogDescription>
              </DialogHeader>

              <div className="rounded-lg border bg-muted/50 p-3 text-sm">
                <p className="font-medium text-foreground">{target.row.authorName}</p>
                <p className="mt-1 text-muted-foreground">{target.row.quote}</p>
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setTarget(null)}>
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant={actionCopy[target.kind].destructive ? "destructive" : "default"}
                  onClick={confirm}
                >
                  {actionCopy[target.kind].confirm}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
