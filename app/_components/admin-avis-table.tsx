"use client"

import { Check, EyeOff, MoreHorizontal, RotateCcw, Trash2, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
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
import { AVIS_STATUS_LABELS, type AvisStatus } from "@/lib/avis-shared"

export type AvisActionKind = "approve" | "reject" | "hide" | "delete"

export type AvisRow = {
  id: string
  authorName: string
  authorRole: string
  authorImage: string | null
  city: string | null
  quote: string
  status: AvisStatus
  createdAt: Date | string
}

const statusClasses: Record<AvisStatus, string> = {
  pending: "bg-warning/5 text-warning border-warning/20",
  approved: "bg-success/5 text-success border-success/20",
  rejected: "bg-destructive/5 text-destructive border-destructive/20",
  hidden: "bg-muted text-muted-foreground border-border",
}

export function AdminAvisTable({
  avis,
  onAction,
}: {
  avis: AvisRow[]
  onAction: (row: AvisRow, kind: AvisActionKind) => void
}) {
  if (avis.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun avis pour ce filtre.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Auteur
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground md:table-cell">
                Ville / quartier
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Avis
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Statut
              </th>
              <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground lg:table-cell">
                Date
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {avis.map((row) => (
              <tr key={row.id} className="border-b align-top last:border-0">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-9 shrink-0">
                      {row.authorImage ? <AvatarImage src={row.authorImage} alt="" /> : null}
                      <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
                        {row.authorName.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {row.authorName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {row.authorRole === "vendor" ? "Vendeur" : "Usager"}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted-foreground md:table-cell">
                  {row.city ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <p className="max-w-md text-sm text-foreground">{row.quote}</p>
                </td>
                <td className="px-4 py-3">
                  <Badge variant="outline" className={cn(statusClasses[row.status])}>
                    {AVIS_STATUS_LABELS[row.status]}
                  </Badge>
                </td>
                <td className="hidden px-4 py-3 text-sm text-muted-foreground lg:table-cell">
                  {formatDate(row.createdAt)}
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="size-4" />
                        <span className="sr-only">
                          Actions pour l&apos;avis de {row.authorName}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      {row.status !== "approved" && (
                        <DropdownMenuItem
                          onClick={() => onAction(row, "approve")}
                          className="flex items-center gap-2"
                        >
                          {row.status === "hidden" ? (
                            <RotateCcw className="size-4" />
                          ) : (
                            <Check className="size-4" />
                          )}
                          {row.status === "hidden" ? "Réafficher" : "Approuver"}
                        </DropdownMenuItem>
                      )}
                      {row.status === "approved" && (
                        <DropdownMenuItem
                          onClick={() => onAction(row, "hide")}
                          className="flex items-center gap-2"
                        >
                          <EyeOff className="size-4" />
                          Masquer
                        </DropdownMenuItem>
                      )}
                      {row.status !== "rejected" && (
                        <DropdownMenuItem
                          onClick={() => onAction(row, "reject")}
                          className="flex items-center gap-2"
                        >
                          <X className="size-4" />
                          Refuser
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onAction(row, "delete")}
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
