"use client"

import { useState } from "react"
import { Download, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { exportUsersCsv } from "@/app/admin/actions"

export function ExportUsersButton() {
  const [isPending, setIsPending] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsPending(true)
    try {
      const result = await exportUsersCsv()
      if (result.ok && result.csv) {
        const blob = new Blob([result.csv], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        link.href = URL.createObjectURL(blob)
        link.download = `gazpoint-utilisateurs-${new Date().toISOString().split("T")[0]}.csv`
        link.click()
        URL.revokeObjectURL(link.href)
      }
    } finally {
      setIsPending(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" variant="outline" disabled={isPending} className="gap-2">
        <Download className="size-4" />
        {isPending ? <Loader2 className="size-4 animate-spin" /> : "Exporter CSV"}
      </Button>
    </form>
  )
}