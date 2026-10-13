"use client"

import { MoreHorizontal, PencilLine, Power, Trash2, Megaphone, ExternalLink } from "lucide-react"
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
import { cn } from "@/lib/utils"

export type PubliciteRow = {
  id: string
  title: string
  description: string | null
  image: string | null
  price: number | null
  priceLabel: string | null
  location: string | null
  phone: string | null
  linkUrl: string | null
  slot: string
  status: string
  startAt: Date | string | null
  endAt: Date | string | null
  future: boolean
  past: boolean
  createdAt: Date | string
}

export function AdminPubliciteTable({
  publicites,
  onEdit,
  onToggle,
  onDelete,
}: {
  publicites: PubliciteRow[]
  onEdit: (p: PubliciteRow) => void
  onToggle: (p: PubliciteRow) => void
  onDelete: (p: PubliciteRow) => void
}) {
  if (publicites.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucune publicité créée.</p>
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
                Publicité
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Emplacement
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Période
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {publicites.map((ad) => {
              const future = ad.future
              const past = ad.past
              return (
                <tr key={ad.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {ad.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={ad.image} alt="" className="h-10 w-14 rounded-md object-cover" />
                      ) : (
                        <div className="flex h-10 w-14 items-center justify-center rounded-md bg-muted">
                          <Megaphone className="size-4 text-muted-foreground" />
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{ad.title}</p>
                        {ad.description && (
                          <p className="max-w-md truncate text-xs text-muted-foreground">{ad.description}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="outline">
                      {ad.slot === "home_hero" ? "Accueil (bannière)" : "À propos"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {ad.startAt || ad.endAt ? (
                      <span className="text-sm text-muted-foreground">
                        {ad.startAt ? `Du ${formatDate(ad.startAt)}` : "Depuis toujours"}
                        {ad.endAt ? ` au ${formatDate(ad.endAt)}` : " · Illimitée"}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">Illimitée</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant="outline"
                      className={cn(
                        ad.status === "active" && !past
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : future
                          ? "bg-blue-50 text-blue-700 border-blue-200"
                          : past
                          ? "bg-gray-100 text-gray-600 border-gray-200"
                          : "bg-red-50 text-red-700 border-red-200"
                      )}
                    >
                      {future ? "Programmée" : past ? "Terminée" : ad.status === "active" ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions pour {ad.title}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuItem onClick={() => onEdit(ad)} className="flex items-center gap-2">
                          <PencilLine className="size-4" />
                          Modifier
                        </DropdownMenuItem>
                        {ad.linkUrl && (
                          <DropdownMenuItem asChild>
                            <a href={ad.linkUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                              <ExternalLink className="size-4" />
                              Ouvrir la page liée
                            </a>
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={() => onToggle(ad)} className="flex items-center gap-2">
                          <Power className="size-4" />
                          {ad.status === "active" ? "Désactiver" : "Activer"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => onDelete(ad)}
                          className="flex items-center gap-2 text-destructive focus:text-destructive"
                        >
                          <Trash2 className="size-4" />
                          Supprimer
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
    </div>
  )
}