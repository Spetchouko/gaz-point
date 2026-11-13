"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Truck, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"

export default function AdminPublicitePage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setTimeout(() => {
      if (!cancelled) setLoading(false)
    }, 300)
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Annonces & publicités</h1>
        <Link href="/dashboard/admin">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" /> Retour
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Emplacements publicitaires</CardTitle>
          <CardDescription>
            Consultez les emplacements publicitaires configurés sur la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12">
            <Truck className="size-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucune donnée publicitaire disponible pour le moment.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
