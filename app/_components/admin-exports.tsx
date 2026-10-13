"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  exportUsersCsv,
  exportVendorsCsv,
  exportDisponibilitesCsv,
  exportPointsCsv,
} from "@/app/admin/actions"

type ExportKind = "users" | "vendors" | "disponibilites" | "points"

type ExportResult = { ok: boolean; csv?: string; message: string }

const exporters: Record<
  ExportKind,
  { label: string; file: string; run: () => Promise<ExportResult> }
> = {
  users: {
    label: "Utilisateurs (CSV)",
    file: "gazpoint-utilisateurs",
    run: exportUsersCsv,
  },
  vendors: {
    label: "Vendeurs (CSV)",
    file: "gazpoint-vendeurs",
    run: exportVendorsCsv,
  },
  disponibilites: {
    label: "Disponibilités (CSV)",
    file: "gazpoint-disponibilites",
    run: () => exportDisponibilitesCsv({ q: undefined, status: "all", source: "all" }),
  },
  points: {
    label: "Points de vente (CSV)",
    file: "gazpoint-points-de-vente",
    run: exportPointsCsv,
  },
}

export function AdminExports() {
  const [pending, setPending] = useState<ExportKind | null>(null)

  const handleExport = async (kind: ExportKind) => {
    setPending(kind)
    try {
      const result = await exporters[kind].run()
      if (result.ok && result.csv) {
        const blob = new Blob([result.csv], {
          type: "text/csv;charset=utf-8;",
        })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `${exporters[kind].file}-${new Date()
          .toISOString()
          .split("T")[0]}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
      }
    } finally {
      setPending(null)
    }
  }

  return (
    <div className="flex flex-wrap gap-3">
      {(Object.keys(exporters) as ExportKind[]).map((kind) => (
        <Button
          key={kind}
          type="button"
          variant="outline"
          className="gap-2"
          disabled={pending !== null}
          onClick={() => handleExport(kind)}
        >
          {pending === kind ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Download className="size-4" />
          )}
          {exporters[kind].label}
        </Button>
      ))}
    </div>
  )
}
