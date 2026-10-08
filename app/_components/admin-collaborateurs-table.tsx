"use client"

import Link from "next/link"
import { User, Mail, Phone, Shield, MoreHorizontal, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { formatDate } from "@/lib/gaz"
import { cn } from "@/lib/utils"

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
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ComponentType<{ className?: string }> }> = {
  admin: { label: "Administrateur", color: "bg-purple-100 text-purple-700", icon: Shield },
  client: { label: "Usager (désactivé)", color: "bg-sky-100 text-sky-700", icon: User },
}

export function AdminCollaborateursTable({ collaborateurs }: { collaborateurs: CollaborateurRow[] }) {
  if (collaborateurs.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-muted-foreground">Aucun collaborateur administrateur trouvé.</p>
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
                Nom
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Email
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Téléphone
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
              const role = roleConfig[c.role] ?? { label: c.role, color: "bg-muted text-foreground", icon: User }
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
                    {c.phoneNumber ? (
                      <a href={`tel:${c.phoneNumber}`} className="text-sm text-muted-foreground hover:text-foreground">
                        {c.phoneNumber}
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={role.color}>
                      <role.icon className="size-3 mr-1" />
                      {role.label}
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
                            Voir le profil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/collaborateurs/${c.id}/edit`} className="flex items-center gap-2">
                            <Settings className="size-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        {c.role === "admin" ? (
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Désactiver (→ Usager)
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            Réactiver (→ Admin)
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
  )
}