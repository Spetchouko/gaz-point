"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { User, BadgeCheck, UserCog, MoreHorizontal, Trash2, Power } from "lucide-react"
import { toggleVendorStatus, toggleUserStatus, deleteUser } from "@/app/admin/actions"
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

type UserRow = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

const roleConfig: Record<string, { label: string; color: string }> = {
  client: { label: "Usager", color: "bg-info/10 text-info" },
  vendor: { label: "Vendeur", color: "bg-success/10 text-success" },
  admin: { label: "Administrateur", color: "bg-navy/10 text-navy" },
  collaborateur: { label: "Collaborateur", color: "bg-warning/10 text-warning" },
}

export function AdminUsersTable({
  users,
  currentUserId,
}: {
  users: UserRow[]
  currentUserId?: string
}) {
  const [, startTransition] = useTransition()
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null)

  const handleToggleRole = (userId: string, currentRole: string) => {
    const formData = new FormData()
    formData.set("userId", userId)
    formData.set("currentRole", currentRole)
    startTransition(async () => {
      await toggleVendorStatus(null, formData)
    })
  }

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

  if (users.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun utilisateur trouvé.</p>
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
                Téléphone
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Statut
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                État
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Inscrit le
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((u) => {
              const role = roleConfig[u.role] ?? { label: u.role, color: "bg-muted text-foreground" }
              const isSelf = u.id === currentUserId
              const isProtected = u.role === "admin" || u.role === "collaborateur"
              return (
                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="font-medium text-foreground hover:text-primary transition-colors"
                      >
                        {u.name}
                      </Link>
                      {u.emailVerified && (
                        <BadgeCheck className="size-4 text-success shrink-0" aria-label="Email vérifié" />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <a href={`mailto:${u.email}`} className="text-sm text-muted-foreground hover:text-foreground underline-offset-2 hover:underline">
                      {u.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    {u.phoneNumber ? (
                      <a href={`tel:${u.phoneNumber}`} className="text-sm text-muted-foreground hover:text-foreground">
                        {u.phoneNumber}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={role.color}>
                      {role.label}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <Badge variant="outline" className={u.isActive ? "bg-success/5 text-success border-success/20" : "bg-destructive/5 text-destructive border-destructive/20"}>
                      {u.isActive ? "Actif" : "Inactif"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <time className="text-sm text-muted-foreground">
                      {formatDate(u.createdAt)}
                    </time>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="size-4" />
                          <span className="sr-only">Actions pour {u.name}</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2">
                            <User className="size-4" />
                            Voir le profil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2">
                            <UserCog className="size-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        {u.role === "vendor" && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleRole(u.id, u.role)}
                              className="flex items-center gap-2"
                            >
                              <Power className="size-4" />
                              Rétrograder (→ Usager)
                            </DropdownMenuItem>
                          </>
                        )}
                        {!isSelf && !isProtected && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              className="flex items-center gap-2"
                            >
                              <Power className="size-4" />
                              {u.isActive ? "Désactiver le compte" : "Réactiver le compte"}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className={cn("flex items-center gap-2 text-destructive focus:text-destructive")}
                              onClick={() => setDeleteTarget(u)}
                            >
                              <Trash2 className="size-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <Dialog open={deleteTarget !== null} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Supprimer le compte</DialogTitle>
            <DialogDescription>
              Voulez-vous vraiment supprimer définitivement le compte de{" "}
              <span className="font-medium text-foreground">{deleteTarget?.name}</span>{" "}
              ({deleteTarget?.email}) ? Cette action est irréversible.
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