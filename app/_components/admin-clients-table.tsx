"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { User, BadgeCheck, MoreHorizontal, Trash2, Power } from "lucide-react"
import { toggleUserStatus, deleteUser } from "@/app/admin/actions"
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
import { formatDate } from "@/lib/gaz"
import { cn } from "@/lib/utils"

type ClientRow = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  phoneVerified: boolean | null
  createdAt: Date | string
  updatedAt: Date | string
}

export function AdminClientsTable({
  rows,
  currentUserId: _currentUserId,
}: {
  rows: ClientRow[]
  currentUserId?: string
}) {
  const [, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<ClientRow | null>(null)

  const handleToggleActive = (userId: string, currentActive: boolean) => {
    const formData = new FormData()
    formData.set("userId", userId)
    formData.set("currentActive", String(currentActive))
    startTransition(async () => {
      await toggleUserStatus(null, formData)
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const formData = new FormData()
    formData.set("userId", deleteTarget.id)
    startTransition(async () => {
      await deleteUser(null, formData)
    })
    setDeleteTarget(null)
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun client trouvé.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full" role="table">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Nom
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Telephone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Vérification
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Inscrit le
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/clients/${c.id}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {c.name}
                  </Link>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <a href={`mailto:${c.email}`} className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                    {c.email}
                  </a>
                </td>
                <td className="px-4 py-3 hidden lg:table-cell">
                  {c.phoneNumber ? (
                    <a href={`tel:${c.phoneNumber}`} className="text-sm text-muted-foreground hover:text-foreground">
                      {c.phoneNumber}
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">—</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <Badge variant="secondary" className="gap-1">
                    <Power className="size-3" />
                    <span>{c.isActive ? "Actif" : "Inactif"}</span>
                  </Badge>
                  <span className="ml-2 flex items-center gap-1">
                    {c.emailVerified && (
                      <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                        <BadgeCheck className="size-3" />
                        <span className="ml-1">Email</span>
                      </Badge>
                    )}
                    {!c.emailVerified && <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Email</Badge>}
                    {c.phoneVerified === true && (
                      <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                        <span className="ml-1">Telephone</span>
                      </Badge>
                    )}
                    {c.phoneVerified === false && (
                      <Badge variant="outline" className="bg-muted text-muted-foreground border-border">Telephone</Badge>
                    )}
                  </span>
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <time className="text-sm text-muted-foreground">
                    {formatDate(c.createdAt)}
                  </time>
                </td>
                <td className="px-4 py-3 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-52">
                      <DropdownMenuItem asChild>
                        <Link href={`/admin/clients/${c.id}`}>
                          <User className="size-4" />
                          Voir le profil
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleToggleActive(c.id, c.isActive)}
                        className="flex items-center gap-2"
                      >
                        <Power className="size-4" />
                        {c.isActive ? "Désactiver" : "Réactiver"}
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className={cn("flex items-center gap-2 text-destructive focus:text-destructive")}
                        onClick={() => setDeleteTarget(c)}
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

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le compte</DialogTitle>
            <DialogDescription>
              Voulez vraiment supprimer dfinitivement le compte de{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>{" "}
              ({deleteTarget?.email})? Cette action est irrfutable.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Annuler</Button>
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
