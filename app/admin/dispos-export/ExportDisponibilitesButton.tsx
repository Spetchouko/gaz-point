"use client"

import { useState, type FormEvent } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportDisponibilitesCsv } from "@/app/admin/actions"
import { useSearchParams } from "next/navigation"

export function ExportDisponibilitesButton() {
  const searchParams = useSearchParams()
  const [isPending, setIsPending] = useState(false)

  const q = searchParams.get("q") || undefined

  const rawStatus = searchParams.get("status")
  const status =
    rawStatus === "disponible" ||
    rawStatus === "indisponible" ||
    rawStatus === "a_confirmer"
      ? rawStatus
      : "all"

  const rawSource = searchParams.get("source")
  const source =
    rawSource === "vendeur" || rawSource === "administration"
      ? rawSource
      : "all"

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const result = await exportDisponibilitesCsv({ q, status, source })
      if (result.ok && result.csv) {
        const blob = new Blob([result.csv], {
          type: "text/csv;charset=utf-8;",
        })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `gazpoint-disponibilites-${new Date()
          .toISOString()
          .split("T")[0]}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button
        type="submit"
        variant="outline"
        className="gap-2"
        disabled={isPending}
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Download className="size-4" />
        )}
        Exporter CSV
      </Button>
    </form>
  )
}
