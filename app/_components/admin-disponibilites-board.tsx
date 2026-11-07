"use client"

import { useState } from "react"
import { ArrowLeft, Plus, Search, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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

type VendorOption = {
  id: string
  name: string
  email: string
}

type BoardMode = "vendor" | "point"

export function AdminDisponibilitesBoard({
  dispos,
  points,
  vendors,
  brands,
}: {
  dispos: DispoRow[]
  points: PointOption[]
  vendors: VendorOption[]
  brands: string[]
}) {
  const [boardOpen, setBoardOpen] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingDispo, setEditingDispo] = useState<DispoData>(null)
  const [formKey, setFormKey] = useState(0)
  const [mode, setMode] = useState<BoardMode>("vendor")
  const [selectedVendor, setSelectedVendor] = useState<VendorOption | null>(null)
  const [selectedPoint, setSelectedPoint] = useState<PointOption | null>(null)
  const [vendorSearch, setVendorSearch] = useState("")

  const filteredVendors = vendors.filter(
    (v) =>
      v.name.toLowerCase().includes(vendorSearch.toLowerCase()) ||
      v.email.toLowerCase().includes(vendorSearch.toLowerCase())
  )

  const vendorPoints = selectedVendor
    ? points.filter((p) => p.vendorName === selectedVendor.name)
    : []

  const handleNew = () => {
    setMode("vendor")
    setSelectedVendor(null)
    setSelectedPoint(null)
    setVendorSearch("")
    setBoardOpen(true)
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
    setFormOpen(true)
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
    setFormOpen(true)
  }

  const selectVendor = (v: VendorOption) => {
    setSelectedVendor(v)
    setSelectedPoint(null)
    setMode("point")
  }

  const selectPoint = (p: PointOption) => {
    setSelectedPoint(p)
    // Fermer le board dialog et ouvrir le form dialog
    setBoardOpen(false)
    setFormOpen(true)
  }

  const goBack = () => {
    if (mode === "point") {
      setMode("vendor")
      setSelectedPoint(null)
    }
  }

  const closeBoard = () => {
    setBoardOpen(false)
    setMode("vendor")
    setSelectedVendor(null)
    setSelectedPoint(null)
    setVendorSearch("")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <Button onClick={handleNew}>
          <Plus className="size-4 mr-2" />
          Nouvelle disponibilité (Admin)
        </Button>
      </div>

      <AdminDisponibilitesTable dispos={dispos} onEdit={handleEdit} onDelete={handleDelete} />

      {/* Dialog de sélection vendeur / point de vente */}
      <Dialog open={boardOpen} onOpenChange={closeBoard}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mode === "vendor" ? "Sélectionner un vendeur" : "Sélectionner un point de vente"}
            </DialogTitle>
            <DialogDescription>
              {mode === "vendor"
                ? "Choisissez le vendeur pour lequel vous souhaitez créer une disponibilité."
                : `Points de vente de ${selectedVendor?.name}`}
            </DialogDescription>
          </DialogHeader>

          {mode === "vendor" && (
            <div className="space-y-4">
              <Input
                placeholder="Rechercher un vendeur (nom ou e-mail)"
                value={vendorSearch}
                onChange={(e) => setVendorSearch(e.target.value)}
              />
              {filteredVendors.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Aucun vendeur trouvé.
                </p>
              )}
              <div className="space-y-2">
                {filteredVendors.map((v) => (
                  <Button
                    key={v.id}
                    onClick={() => selectVendor(v)}
                    variant="outline"
                    className="w-full justify-between text-left"
                  >
                    <span className="font-medium">{v.name}</span>
                    <span className="text-xs text-muted-foreground">{v.email}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {mode === "point" && selectedVendor && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={goBack}>
                  <ArrowLeft className="size-4" />
                </Button>
                <h3 className="text-sm font-medium">
                  {selectedVendor.name}
                </h3>
              </div>
              <p className="text-sm text-muted-foreground">
                Choisissez le point de vente pour lequel créer une disponibilité.
              </p>
              {vendorPoints.length === 0 && (
                <div className="rounded-lg border bg-muted p-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    Ce vendeur ne possède aucun point de vente. Il doit d’en créer un depuis son espace vendeur avant que vous puissiez publier une disponibilité pour lui.
                  </p>
                </div>
              )}
              <div className="space-y-2">
                {vendorPoints.map((p) => (
                  <Button
                    key={p.id}
                    onClick={() => selectPoint(p)}
                    variant="outline"
                    className="w-full justify-between text-left"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.district}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Formulaire de création de disponibilité (ouvert après sélection du point) */}
      <AdminDisponibiliteForm
        key={formKey}
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setEditingDispo(null)
        }}
        editingDispo={editingDispo}
        points={points}
        brands={brands}
        vendorId={selectedPoint ? selectedVendor?.id : undefined}
        pointId={selectedPoint?.id}
        vendorName={selectedPoint ? selectedVendor?.name : undefined}
        pointName={selectedPoint?.name}
      />
    </div>
  )
}
