"use client"

import Link from "next/link"
import { User, Store, Phone, Mail, MapPin, Package, Trash2, MoreHorizontal, UserPlus } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate, formatDateTime } from "@/lib/gaz"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"

type PointRow = {
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
  activeDisposCount: number
  totalQty: number
  latestDispoDate: Date | string | null
  latestDispoStatus: string | null
  latestDispoFormat: string | null
  latestDispoQty: number | null
  hasActiveDispo: boolean
  createdAt: Date | string
}

export function AdminPointsTable({ points }: { points: PointRow[] }) {
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
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
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
                  <Badge variant={p.hasActiveDispo ? "default" : "secondary"} className={p.hasActiveDispo ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}>
                    {p.hasActiveDispo ? "Actif" : "Inactif"}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  {p.latestDispoStatus ? (
                    <>
                      <Badge variant="outline" className={availabilityBadgeClass[p.latestDispoStatus] ?? "bg-muted"}>
                        {availabilityLabel[p.latestDispoStatus] ?? p.latestDispoStatus}
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
                      {p.vendorId ? (
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/vendeurs/${p.vendorId}`} className="flex items-center gap-2">
                            <User className="size-4" />
                            Voir le vendeur
                          </Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem className="flex items-center gap-2">
                          <UserPlus className="size-4" />
                          Assigner un vendeur
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/disponibilites?point=${p.id}`} className="flex items-center gap-2">
                          <Package className="size-4" />
                          Gérer disponibilités
                        </Link>
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