"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AdminDisponibilitesTable,
  type DispoRow,
} from "@/app/_components/admin-disponibilites-table"
import {
  AdminDisponibiliteForm,
  type DispoData,
} from "@/app/_components/admin-disponibilite-form"

type PointOption = {
  id: string
  name: string
  district: string
  vendorName: string
}

export function AdminDisponibilitesBoard({
  dispos,
  points,
  brands,
}: {
  dispos: DispoRow[]
  points: PointOption[]
  brands: string[]
}) {
  const [open, setOpen] = useState(false)
  const [editingDispo, setEditingDispo] = useState<DispoData>(null)
  const [formKey, setFormKey] = useState(0)

  const handleNew = () => {
    setEditingDispo(null)
    setFormKey((k) => k + 1)
    setOpen(true)
  }

  const handleEdit = (d: DispoRow) => {
    setEditingDispo({
      id: d.id,
      pointId: d.pointId,
      status: d.status,
      quantity: d.quantity,
      format: d.format,
      brand: d.brand,
      weightKg: d.weightKg,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      phone: d.phone,
      note: d.note,
      pointName: d.pointName,
      vendorId: d.vendorId,
      vendorName: d.vendorName,
    })
    setFormKey((k) => k + 1)
    setOpen(true)
  }

  const handleDelete = (d: DispoRow) => {
    setEditingDispo({
      id: d.id,
      pointId: d.pointId,
      status: d.status,
      quantity: d.quantity,
      format: d.format,
      brand: d.brand,
      weightKg: d.weightKg,
      expiresAt: d.expiresAt ? new Date(d.expiresAt) : null,
      phone: d.phone,
      note: d.note,
      pointName: d.pointName,
      vendorId: d.vendorId,
      vendorName: d.vendorName,
    })
    setFormKey((k) => k + 1)
    setOpen(true)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button onClick={handleNew}>
          <Plus className="size-4 mr-2" />
          Nouvelle disponibilité (Admin)
        </Button>
      </div>

      <AdminDisponibilitesTable dispos={dispos} onEdit={handleEdit} onDelete={handleDelete} />

      <AdminDisponibiliteForm
        key={formKey}
        open={open}
        onClose={() => {
          setOpen(false)
          setEditingDispo(null)
        }}
        editingDispo={editingDispo}
        points={points}
        brands={brands}
      />
    </div>
  )
}