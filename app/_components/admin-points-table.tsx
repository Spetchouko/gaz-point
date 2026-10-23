"use client"

import Link from "next/link"
import { UserPlus, Store, Trash2, MoreHorizontal, PencilLine, Power, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/gaz"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"

export type PointRow = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[] | null
  formats: string[] | null
  vendorId: string | null
  vendorName: string | null
  vendorEmail: string | null
  vendorPhone: string | null
  isActive: boolean
  activeDisposCount: number
  totalQty: number
  latestDispoDate: Date | string | null
  latestDispoStatus: string | null
  latestDispoFormat: string | null
  latestDispoQty: number | null
  hasActiveDispo: boolean
  createdAt: Date | string
}

export function AdminPointsTable({
  points,
  onEdit,
  onToggle,
  onAssign,
  onDelete,
}: {
  points: PointRow[]
  onEdit: (p: PointRow) => void
  onToggle: (p: PointRow) => void
  onAssign: (p: PointRow) => void
  onDelete: (p: PointRow) => void
}) {
  if (points.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun point de vente trouvé.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Point de vente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Vendeur
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Téléphone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                Localisation
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Disponibilité
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Créé le
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {points.map((p) => (
              <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <Link href={`/admin/points-de-vente/${p.id}`} className="font-medium text-foreground hover:text-primary transition-colors">
                    {p.name}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.vendorName ? (
                    <div>
                      <p className="font-medium">{p.vendorName}</p>
                      <p className="text-xs text-muted-foreground">{p.vendorEmail}</p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="bg-warning/5 text-warning border-warning/20">
                      <UserPlus className="size-3 mr-1" />
                      Sans vendeur
                    </Badge>
                  )}
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {p.vendorPhone ? (
                    <a href={`tel:${p.vendorPhone}`} className="text-sm text-muted-foreground hover:text-foreground">
                      {p.vendorPhone}
                    </a>
                  ) : p.phone ? (
                    <a href={`tel:${p.phone}`} className="text-sm text-muted-foreground hover:text-foreground">
                      {p.phone}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden xl:table-cell">
                  <span className="text-sm text-muted-foreground">{p.address} — {p.district}</span>
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant="outline"
                    className={p.isActive ? "bg-success/5 text-success border-success/20" : "bg-destructive/5 text-destructive border-destructive/20"}
                  >
                    {p.isActive ? "Actif" : "Inactif"}
                  </Badge>
                  {!p.isActive && (
                    <p className="text-xs text-muted-foreground mt-1">Masqué du public</p>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.latestDispoStatus ? (
                    <>
                      <Badge variant="outline" className={availabilityBadgeClass[p.latestDispoStatus as keyof typeof availabilityBadgeClass] ?? "bg-muted"}>
                        {availabilityLabel[p.latestDispoStatus as keyof typeof availabilityLabel] ?? p.latestDispoStatus}
                      </Badge>
                      {p.latestDispoQty !== null && p.latestDispoQty > 0 && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          {p.latestDispoQty} {p.latestDispoFormat ?? "bouteilles"}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <time className="text-sm text-muted-foreground">{formatDate(p.createdAt)}</time>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Actions pour {p.name}</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/points-de-vente/${p.id}`} className="flex items-center gap-2">
                          <Store className="size-4" />
                          Voir détails
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onEdit(p)} className="flex items-center gap-2">
                        <PencilLine className="size-4" />
                        Modifier
                      </DropdownMenuItem>
                      {p.vendorName ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendeurs/${p.vendorId}`} className="flex items-center gap-2">
                            <User className="size-4" />
                            Voir le vendeur
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem onClick={() => onAssign(p)} className="flex items-center gap-2">
                          <UserPlus className="size-4" />
                          Assigner un vendeur
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={() => onToggle(p)} className="flex items-center gap-2">
                        <Power className="size-4" />
                        {p.isActive ? "Désactiver (masquer)" : "Réactiver"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onDelete(p)}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}