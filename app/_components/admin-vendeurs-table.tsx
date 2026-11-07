"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { User, Trash2, MoreHorizontal, Settings, Plus } from "lucide-react"
import { toggleVendorStatus, deleteVendor } from "@/app/admin/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AdminDisponibiliteForm,
} from "@/app/_components/admin-disponibilite-form"
import { formatDate } from "@/lib/gaz"

type VendorRow = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  createdAt: Date | string
  points: {
    id: string
    name: string
    district: string
    address: string
    phone: string | null
  }[]
  dispos: {
    id: string
    status: string
    quantity: number | null
    format: string | null
    createdAt: Date | string
  }[]
  activeDisposCount: number
  totalQty: number
  latestDispoDate: Date | string | null
  hasActiveDispo: boolean
}

const availabilityLabel: Record<string, string> = {
  disponible: "Disponible",
  a_confirmer: "À confirmer",
  indisponible: "Indisponible",
}

const availabilityBadgeClass: Record<string, string> = {
  disponible: "bg-success/10 text-success border-success/20",
  a_confirmer: "bg-warning/10 text-warning border-warning/20",
  indisponible: "bg-destructive/10 text-destructive border-destructive/20",
}

export function AdminVendeursTable({ vendors }: { vendors: VendorRow[] }) {
  const [, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<VendorRow | null>(null)
  const [assistingVendor, setAssistingVendor] = useState<VendorRow | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [selectedPoint, setSelectedPoint] = useState<VendorRow["points"][number] | null>(null)

  const handleToggle = (userId: string, currentRole: string) => {
    const formData = new FormData()
    formData.set("userId", userId)
    formData.set("currentRole", currentRole)
    startTransition(async () => {
      await toggleVendorStatus(null, formData)
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const formData = new FormData()
    formData.set("userId", deleteTarget.id)
    startTransition(async () => {
      await deleteVendor(null, formData)
    })
    setDeleteTarget(null)
  }

  const startAssistance = (v: VendorRow) => {
    setAssistingVendor(v)
    setSelectedPoint(null)
  }

  const selectPointForAssistance = (p: VendorRow["points"][number]) => {
    setSelectedPoint(p)
    setFormOpen(true)
  }

  if (vendors.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun vendeur trouvé.</p>
      </div>
    )
  }

  return (
    <div className="admin-table">
      <div className="admin-table__wrap">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nom / Responsable
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">
                Point de vente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                Téléphone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden lg:table-cell">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden xl:table-cell">
                Localisation
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">
                Disponibilité
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground hidden md:table-cell">
                Inscrit le
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {vendors.map((v) => {
              const mainPoint = v.points[0]
              const latestDispo = v.dispos.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0]
              return (
                <tr key={v.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/vendeurs/${v.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {v.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {mainPoint ? (
                      <Link href="/admin/points-de-vente" className="font-medium text-foreground hover:text-primary underline-offset-2 hover:underline">
                        {mainPoint.name}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {mainPoint?.phone ? (
                      <a href={`tel:${mainPoint.phone}`} className="text-sm text-muted-foreground hover:text-foreground">
                        {mainPoint.phone}
                      </a>
                    ) : v.phoneNumber ? (
                      <a href={`tel:${v.phoneNumber}`} className="text-sm text-muted-foreground hover:text-foreground">
                        {v.phoneNumber}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <a href={`mailto:${v.email}`} className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                      {v.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    {mainPoint ? (
                      <span className="text-sm text-muted-foreground">
                        {mainPoint.address} — {mainPoint.district}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={v.hasActiveDispo ? "default" : "secondary"} className={v.hasActiveDispo ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                      {v.hasActiveDispo ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {latestDispo ? (
                      <>
                        <Badge variant="outline" className={availabilityBadgeClass[latestDispo.status] ?? "bg-muted"}>
                          {availabilityLabel[latestDispo.status] ?? latestDispo.status}
                        </Badge>
                        {latestDispo.quantity !== null && latestDispo.quantity > 0 && (
                          <span className="ml-2 text-sm text-muted-foreground">
                            {latestDispo.quantity} {latestDispo.format ?? "bouteilles"}
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <time className="text-sm text-muted-foreground">
                      {formatDate(v.createdAt)}
                    </time>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions pour {v.name}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendeurs/${v.id}`} className="flex items-center gap-2">
                            <User className="size-4" />
                            Voir la fiche
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendeurs/${v.id}`} className="flex items-center gap-2">
                            <Settings className="size-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        {v.points.length > 0 ? (
                          <DropdownMenuItem
                            onClick={() => startAssistance(v)}
                            className="flex items-center gap-2"
                          >
                            <Plus className="size-4" />
                            Créer une disponibilité
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem className="text-muted-foreground" disabled>
                            <Plus className="size-4" />
                            Aucun point de vente
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => handleToggle(v.id, v.role)}
                        >
                          Désactiver (→ Usager)
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                          onClick={() => setDeleteTarget(v)}
                        >
                          <Trash2 className="size-4" />
                          Supprimer le vendeur
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Dialog d'assistance : sélection du point de vente du vendeur */}
      <Dialog open={assistingVendor !== null} onOpenChange={(o) => !o && setAssistingVendor(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Assister {assistingVendor?.name}</DialogTitle>
            <DialogDescription>
              Sélectionnez le point de vente pour lequel créer une disponibilité.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {assistingVendor?.points.length === 0 ? (
              <div className="rounded-lg border bg-muted p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  Ce vendeur ne possède aucun point de vente. Il doit d’en créer un depuis son espace vendeur.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {assistingVendor!.points.map((p) => (
                  <Button
                    key={p.id}
                    onClick={() => selectPointForAssistance(p)}
                    variant="outline"
                    className="w-full justify-between text-left"
                  >
                    <span className="font-medium">{p.name}</span>
                    <span className="text-xs text-muted-foreground">{p.district}</span>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Formulaire de création de disponibilité (assistance) */}
      <AdminDisponibiliteForm
        open={formOpen}
        onClose={() => {
          setFormOpen(false)
          setSelectedPoint(null)
          setAssistingVendor(null)
        }}
        editingDispo={null}
        points={assistingVendor?.points.map((p) => ({
          id: p.id,
          name: p.name,
          district: p.district,
          vendorName: assistingVendor.name,
        })) ?? []}
        brands={[]}
        vendorId={selectedPoint ? assistingVendor?.id : undefined}
        pointId={selectedPoint?.id}
        vendorName={assistingVendor?.name}
        pointName={selectedPoint?.name}
      />

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le vendeur</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer définitivement le compte de{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>{" "}
              ({deleteTarget?.email}) ainsi que ses points de vente ? Cette action est
              irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
              Annuler
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="size-4 mr-2" />
              Supprimer définitivement
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
