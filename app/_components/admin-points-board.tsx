"use client"

import { useState } from "react"
import { Plus, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { deletePoint, togglePointStatus } from "@/app/admin/actions"
import { AdminPointsTable, type PointRow } from "@/app/_components/admin-points-table"
import { AdminPointForm, type PointOption, type VendorOption } from "@/app/_components/admin-point-form"

export function AdminPointsBoard({
  points,
  vendors,
}: {
  points: PointRow[]
  vendors: VendorOption[]
}) {
  const [dialogState, setDialogState] = useState<{
    mode: "create" | "edit" | "assign"
    point: PointOption | null
  } | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PointRow | null>(null)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
  const [toggleTarget, setToggleTarget] = useState<PointRow | null>(null)
  const [toggleMsg, setToggleMsg] = useState<string | null>(null)

  const openForm = (mode: "create" | "edit" | "assign", point: PointRow | null) => {
    setDialogState({
      mode,
      point: point
        ? {
            id: point.id,
            name: point.name,
            district: point.district,
            address: point.address,
            phone: point.phone,
            brands: point.brands,
            formats: point.formats,
            vendorId: point.vendorId,
            vendorName: point.vendorName,
          }
        : null,
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteMsg(null)
    const formData = new FormData()
    formData.set("pointId", deleteTarget.id)
    const result = await deletePoint(null, formData)
    if (result.ok) {
      setDeleteTarget(null)
    } else {
      setDeleteMsg(result.message)
    }
  }

  const confirmToggle = async () => {
    if (!toggleTarget) return
    setToggleMsg(null)
    const formData = new FormData()
    formData.set("pointId", toggleTarget.id)
    formData.set("currentActive", String(toggleTarget.isActive))
    const result = await togglePointStatus(null, formData)
    setToggleMsg(result.ok ? null : result.message)
    if (result.ok) setToggleTarget(null)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => openForm("create", null)}>
          <Plus className="size-4 mr-2" />
          Nouveau point de vente
        </Button>
      </div>

      <AdminPointsTable
        points={points}
        onEdit={(p) => openForm("edit", p)}
        onAssign={(p) => openForm("assign", p)}
        onToggle={(p) => setToggleTarget(p)}
        onDelete={(p) => setDeleteTarget(p)}
      />

      <AdminPointForm
        open={dialogState !== null}
        onClose={() => setDialogState(null)}
        mode={dialogState?.mode ?? "create"}
        point={dialogState?.point ?? null}
        vendors={vendors}
      />

      <Dialog open={toggleTarget !== null} onOpenChange={() => setToggleTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.isActive ? "Désactiver ce dépôt ?" : "Réactiver ce dépôt ?"}
            </DialogTitle>
            <DialogDescription>
              {toggleTarget?.isActive
                ? `« ${toggleTarget?.name} » sera masqué du site public. Les disponibilités associées ne seront plus affichées.`
                : `« ${toggleTarget?.name} » redeviendra visible sur le site public.`}
            </DialogDescription>
          </DialogHeader>
          {toggleMsg && <p className="text-sm text-destructive">{toggleMsg}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setToggleTarget(null)}>Annuler</Button>
            <Button type="button" onClick={confirmToggle}>
              <Power className="size-4 mr-2" />
              {toggleTarget?.isActive ? "Désactiver" : "Réactiver"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le point de vente ?</DialogTitle>
            <DialogDescription>
              « {deleteTarget?.name} » sera supprimé définitivement ainsi que toutes ses disponibilités.
            </DialogDescription>
          </DialogHeader>
          {deleteMsg && <p className="text-sm text-destructive">{deleteMsg}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setDeleteTarget(null)}>Annuler</Button>
            <Button type="button" variant="destructive" onClick={confirmDelete}>Supprimer</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}