"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Phone, MapPin, Power, Trash2, PencilLine, UserPlus, Store } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { deletePoint, togglePointStatus } from "@/app/admin/actions"
import { AdminPointForm, type VendorOption } from "@/app/_components/admin-point-form"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"
import { formatDate } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type DispoRow = {
  id: string
  status: string | null
  quantity: number | null
  format: string | null
  brand: string | null
  note: string | null
  createdAt: Date | string
  updatedAt: Date | string | null
}

export function AdminPointDetail({
  point,
  dispos,
  vendors,
}: {
  point: {
    id: string
    name: string
    district: string
    address: string
    phone: string | null
    brands: string[] | null
    formats: string[] | null
    isActive: boolean
    createdAt: Date | string
    vendorId: string | null
    vendorName: string | null
    vendorEmail: string | null
  }
  dispos: DispoRow[]
  vendors: VendorOption[]
}) {
  const router = useRouter()
  const [dialogMode, setDialogMode] = useState<"edit" | "assign" | null>(null)
  const [confirm, setConfirm] = useState<"toggle" | "delete" | null>(null)
  const [msg, setMsg] = useState<string | null>(null)

  const runAction = async (
    action: typeof togglePointStatus | typeof deletePoint,
    formData: FormData
  ) => {
    setMsg(null)
    const result = await action(null, formData)
    if (result.ok) {
      if (action === deletePoint) {
        router.push("/admin/points-de-vente")
      } else {
        setConfirm(null)
        router.refresh()
      }
    } else {
      setMsg(result.message)
    }
  }

  return (
    <div className="space-y-6">
      <Link
        href="/admin/points-de-vente"
        className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" />
        Retour aux points de vente
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{point.name}</h1>
            <Badge
              variant="outline"
              className={point.isActive ? "bg-success/5 text-success border-success/20" : "bg-destructive/5 text-destructive border-destructive/20"}
            >
              {point.isActive ? "Actif" : "Inactif"}
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground">
            Créé le {formatDate(point.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => setDialogMode("edit")}>
            <PencilLine className="size-4 mr-2" />
            Modifier
          </Button>
          {point.vendorId ? (
            <Button
              variant="outline"
              size="sm"
              render={<Link href={`/admin/vendeurs/${point.vendorId}`} />}
              nativeButton={false}
            >
              <Store className="size-4 mr-2" />
              Voir le vendeur
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => setDialogMode("assign")}>
              <UserPlus className="size-4 mr-2" />
              Assigner un vendeur
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirm("toggle")}
            className={!point.isActive ? "text-success" : ""}
          >
            <Power className="size-4 mr-2" />
            {point.isActive ? "Désactiver" : "Réactiver"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-destructive"
            onClick={() => setConfirm("delete")}
          >
            <Trash2 className="size-4 mr-2" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Informations du dépôt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <MapPin className="size-4 mt-0.5 text-muted-foreground" />
              <span>
                {point.address}
                <span className="text-muted-foreground"> — {point.district}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="size-4 text-muted-foreground" />
              {point.phone ? (
                <a href={`tel:${point.phone}`} className="hover:text-primary">{point.phone}</a>
              ) : (
                <span className="text-muted-foreground">Non renseigné</span>
              )}
            </div>
            {point.vendorName ? (
              <p>
                Vendeur :{" "}
                <Link href={`/admin/vendeurs/${point.vendorId}`} className="font-medium text-primary hover:underline">
                  {point.vendorName}
                </Link>
                <span className="text-muted-foreground"> ({point.vendorEmail})</span>
              </p>
            ) : (
              <p className="flex items-center gap-2 text-warning">
                <UserPlus className="size-4" />
                Aucun vendeur rattaché
              </p>
            )}
            <div>
              <p className="mb-1 font-medium">Marques :</p>
              <div className="flex flex-wrap gap-1.5">
                {(point.brands ?? []).length > 0 ? (
                  point.brands!.map((b) => (
                    <Badge key={b} variant="secondary">{b}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
            <div>
              <p className="mb-1 font-medium">Formats :</p>
              <div className="flex flex-wrap gap-1.5">
                {(point.formats ?? []).length > 0 ? (
                  point.formats!.map((f) => (
                    <Badge key={f} variant="secondary">{f}</Badge>
                  ))
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              Disponibilités ({dispos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {dispos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune disponibilité enregistrée sur ce dépôt.
              </p>
            ) : (
              dispos.map((d) => (
                <div
                  key={d.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge
                      variant="outline"
                      className={availabilityBadgeClass[d.status as keyof typeof availabilityBadgeClass] ?? "bg-muted"}
                    >
                      {availabilityLabel[d.status as keyof typeof availabilityLabel] ?? d.status ?? "—"}
                    </Badge>
                    <span className="text-muted-foreground">
                      {d.quantity !== null ? `${d.quantity} bouteille${d.quantity > 1 ? "s" : ""}` : "Quantité inconnue"}
                      {d.format ? ` · ${d.format}` : ""}
                      {d.brand ? ` · ${d.brand}` : ""}
                    </span>
                  </div>
                  <span className={cn("text-xs", d.status === "disponible" ? "text-success" : "text-muted-foreground")}>
                    MAJ {d.updatedAt ? formatDate(d.updatedAt) : formatDate(d.createdAt)}
                  </span>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      <AdminPointForm
        open={dialogMode !== null}
        onClose={() => setDialogMode(null)}
        mode={dialogMode ?? "edit"}
        point={point}
        vendors={vendors}
      />

      <Dialog open={confirm !== null} onOpenChange={() => setConfirm(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {confirm === "toggle"
                ? point.isActive
                  ? "Désactiver ce dépôt ?"
                  : "Réactiver ce dépôt ?"
                : "Supprimer ce dépôt ?"}
            </DialogTitle>
            <DialogDescription>
              {confirm === "toggle"
                ? point.isActive
                  ? "Il sera masqué du site public ainsi que ses disponibilités."
                  : "Il redeviendra visible sur le site public."
                : "Le dépôt et toutes ses disponibilités seront supprimés définitivement."}
            </DialogDescription>
          </DialogHeader>
          {msg && <p className="text-sm text-destructive">{msg}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setConfirm(null)}>Annuler</Button>
            <Button
              type="button"
              variant={confirm === "delete" ? "destructive" : "default"}
              onClick={() => {
                const formData = new FormData()
                formData.set("pointId", point.id)
                if (confirm === "toggle") formData.set("currentActive", String(point.isActive))
                runAction(confirm === "toggle" ? togglePointStatus : deletePoint, formData)
              }}
            >
              {confirm === "toggle" ? (point.isActive ? "Désactiver" : "Réactiver") : "Supprimer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}