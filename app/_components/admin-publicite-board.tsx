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
import { deletePublicite, togglePubliciteStatus } from "@/app/admin/actions"
import { AdminPubliciteTable, type PubliciteRow } from "@/app/_components/admin-publicite-table"
import { AdminPubliciteForm } from "@/app/_components/admin-publicite-form"

export function AdminPubliciteBoard({ publicites }: { publicites: PubliciteRow[] }) {
  const [editTarget, setEditTarget] = useState<PubliciteRow | null | "new">(null)
  const [toggleTarget, setToggleTarget] = useState<PubliciteRow | null>(null)
  const [toggleMsg, setToggleMsg] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<PubliciteRow | null>(null)
  const [deleteMsg, setDeleteMsg] = useState<string | null>(null)

  const confirmToggle = async () => {
    if (!toggleTarget) return
    setToggleMsg(null)
    const formData = new FormData()
    formData.set("publiciteId", toggleTarget.id)
    formData.set("currentStatus", toggleTarget.status)
    const result = await togglePubliciteStatus(null, formData)
    setToggleMsg(result.ok ? null : result.message)
    if (result.ok) setToggleTarget(null)
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setDeleteMsg(null)
    const formData = new FormData()
    formData.set("publiciteId", deleteTarget.id)
    const result = await deletePublicite(null, formData)
    if (result.ok) setDeleteTarget(null)
    else setDeleteMsg(result.message)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={() => setEditTarget("new")}>
          <Plus className="size-4 mr-2" />
          Nouvelle publicité
        </Button>
      </div>

      <AdminPubliciteTable
        publicites={publicites}
        onEdit={(p) => setEditTarget(p)}
        onToggle={(p) => setToggleTarget(p)}
        onDelete={(p) => setDeleteTarget(p)}
      />

      <AdminPubliciteForm
        key={editTarget === "new" ? "new" : editTarget?.id ?? "closed"}
        open={editTarget !== null}
        onClose={() => setEditTarget(null)}
        edit={editTarget === "new" ? null : editTarget}
      />

      <Dialog open={toggleTarget !== null} onOpenChange={() => setToggleTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {toggleTarget?.status === "active" ? "Désactiver cette publicité ?" : "Activer cette publicité ?"}
            </DialogTitle>
            <DialogDescription>
              {toggleTarget?.status === "active"
                ? `« ${toggleTarget?.title} » ne sera plus affichée sur le site public.`
                : `« ${toggleTarget?.title} » redeviendra visible sur le site public.`}
            </DialogDescription>
          </DialogHeader>
          {toggleMsg && <p className="text-sm text-destructive">{toggleMsg}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setToggleTarget(null)}>Annuler</Button>
            <Button type="button" onClick={confirmToggle}>
              <Power className="size-4 mr-2" />
              {toggleTarget?.status === "active" ? "Désactiver" : "Activer"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteTarget !== null} onOpenChange={() => setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer cette publicité ?</DialogTitle>
            <DialogDescription>
              « {deleteTarget?.title} » sera supprimée définitivement.
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