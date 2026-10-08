"use client"

import Link from "next/link"
import { User, Store, MapPin, Package, Phone, Trash2, MoreHorizontal } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDateTime } from "@/lib/gaz"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"

type DispoRow = {
  id: string
  pointId: string
  status: string
  quantity: number | null
  format: string | null
  phone: string | null
  note: string | null
  source: string
  createdAt: Date | string
  pointName: string
  pointDistrict: string
  pointAddress: string
  vendorName: string
  vendorEmail: string
}

export function AdminDisponibilitesTable({ dispos }: { dispos: DispoRow[] }) {
  if (dispos.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucune disponibilité trouvée.</p>
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
                Vendeur
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Point de vente
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Quantité
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Localisation
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Dernière MAJ
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {dispos.map((d) => (
              <tr key={d.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium">{d.vendorName}</p>
                    <p className="text-xs text-muted-foreground">{d.vendorEmail}</p>
                  </div>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <Link href={`/admin/points-de-vente/${d.pointId}`} className="font-medium text-foreground hover:text-primary underline-offset-2 hover:underline">
                    {d.pointName}
                  </Link>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="bg-primary/10 text-primary">
                    {d.format ?? "—"}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-right hidden sm:table-cell font-mono text-sm">
                  {d.quantity !== null ? d.quantity.toLocaleString("fr-FR") : "—"}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={availabilityBadgeClass[d.status] ?? "bg-muted"}>
                    {availabilityLabel[d.status] ?? d.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                  {d.pointAddress} — {d.pointDistrict}
                </td>
                <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                  {formatDateTime(d.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">Actions pour cette disponibilité</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/disponibilites/${d.id}/edit`} className="flex items-center gap-2">
                          <Package className="size-4" />
                          Modifier
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/points-de-vente/${d.pointId}`} className="flex items-center gap-2">
                          <Store className="size-4" />
                          Voir le point de vente
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/vendeurs/...`} className="flex items-center gap-2">
                          <User className="size-4" />
                          Voir le vendeur
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive">
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