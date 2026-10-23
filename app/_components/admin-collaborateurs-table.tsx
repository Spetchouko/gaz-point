"use client"

import { useTransition } from "react"
import Link from "next/link"
import { User, Shield, MoreHorizontal, UserCheck, KeyRound } from "lucide-react"
import {
  toggleAdminCollaboratorStatus,
  reactivateAdminCollaborator,
} from "@/app/admin/actions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { AdminCollabPermissionsDialog } from "@/app/_components/admin-collab-permissions-dialog"
import { ADMIN_MODULE_LABELS, type AdminModuleUi } from "@/app/_components/admin-module-labels"
import { formatDate } from "@/lib/gaz"
import { useState } from "react"

type CollaborateurRow = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  createdAt: Date | string
  updatedAt: Date | string
  emailVerified: boolean
  phoneVerified: boolean | null
  permissions: AdminModuleUi[]
}

const roleConfig: Record<string, { label: string; color: string; Icon: React.ComponentType<{ className?: string }> }> = {
  admin: { label: "Administrateur", color: "bg-navy/10 text-navy", Icon: Shield },
  collaborateur: { label: "Collaborateur", color: "bg-navy/10 text-navy", Icon: UserCheck },
  client: { label: "Usager (désactivé)", color: "bg-info/10 text-info", Icon: User },
}

export function AdminCollaborateursTable({ collaborateurs }: { collaborateurs: CollaborateurRow[] }) {
  const [, startTransition] = useTransition()
  const [permissionsFor, setPermissionsFor] = useState<CollaborateurRow | null>(null)

  const handleToggle = (userId: string, currentRole: string) => {
    const formData = new FormData()
    formData.set("userId", userId)
    formData.set("currentRole", currentRole)
    startTransition(async () => {
      await toggleAdminCollaboratorStatus(null, formData)
    })
  }

  const handleReactivate = (userId: string) => {
    const formData = new FormData()
    formData.set("userId", userId)
    startTransition(async () => {
      await reactivateAdminCollaborator(null, formData)
    })
  }

  if (collaborateurs.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun collaborateur administrateur trouvé.</p>
      </div>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full" role="table">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                  Permissions
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                  Inscrit le
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {collaborateurs.map((c) => {
                const config = roleConfig[c.role] ?? { label: c.role, color: "bg-muted text-foreground", Icon: User }
                const isAdmin = c.role === "admin"
                const RoleIcon = config.Icon
                return (
                  <tr key={c.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/collaborateurs/${c.id}`}
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
                      {isAdmin ? (
                        <Badge variant="secondary" className="bg-navy/10 text-navy">
                          Tous les accès
                        </Badge>
                      ) : c.permissions.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {c.permissions.map((p) => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {ADMIN_MODULE_LABELS[p]}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Consultation seule</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className={config.color}>
                        <RoleIcon className="size-3 mr-1" />
                        {config.label}
                      </Badge>
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
                            <span className="sr-only">Actions pour {c.name}</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/collaborateurs/${c.id}`} className="flex items-center gap-2">
                              <User className="size-4" />
                              Voir la fiche
                            </Link>
                          </DropdownMenuItem>
                          {!isAdmin && c.role === "collaborateur" && (
                            <DropdownMenuItem onClick={() => setPermissionsFor(c)}>
                              <KeyRound className="size-4 mr-2" />
                              Gérer les permissions
                            </DropdownMenuItem>
                          )}
                          {c.role !== "client" ? (
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => handleToggle(c.id, c.role)}
                            >
                              Désactiver (→ Usager)
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => handleReactivate(c.id)}>
                              Réactiver (→ Collaborateur)
                            </DropdownMenuItem>
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
      </div>

      {permissionsFor && (
        <AdminCollabPermissionsDialog
          open={Boolean(permissionsFor)}
          onClose={() => setPermissionsFor(null)}
          collaboratorId={permissionsFor.id}
          collaboratorName={permissionsFor.name}
          initialModules={permissionsFor.permissions}
        />
      )}
    </>
  )
}