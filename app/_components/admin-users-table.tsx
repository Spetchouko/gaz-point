"use client"

import Link from "next/link"
import { User, Mail, Phone, MapPin, BadgeCheck, UserCog, MoreHorizontal } from "lucide-react"
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

type UserRow = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  createdAt: Date | string
  updatedAt: Date | string
}

const roleConfig: Record<string, { label: string; color: string }> = {
  client: { label: "Usager", color: "bg-sky-100 text-sky-700" },
  vendor: { label: "Vendeur", color: "bg-emerald-100 text-emerald-700" },
  admin: { label: "Administrateur", color: "bg-purple-100 text-purple-700" },
}

export function AdminUsersTable({ users }: { users: UserRow[] }) {
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
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">
                Localisation
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Statut
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
            {users.map((u) => {
              const role = roleConfig[u.role] ?? { label: u.role, color: "bg-muted text-foreground" }
              return (
                <tr key={u.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/users/${u.id}`}
                      className="font-medium text-foreground hover:text-primary transition-colors"
                    >
                      {u.name}
                    </Link>
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
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">—</span>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="secondary" className={role.color}>
                      {role.label}
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
                      <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${u.id}`} className="flex items-center gap-2">
                            <User className="size-4" />
                            Voir le profil
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/users/${u.id}/edit`} className="flex items-center gap-2">
                            <UserCog className="size-4" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        {u.role !== "admin" && (
                          <DropdownMenuItem
                            className={cn(
                              "text-destructive focus:text-destructive",
                              u.role === "vendor" ? "" : "text-destructive"
                            )}
                          >
                            {u.role === "vendor" ? "Désactiver (→ Usager)" : "Activer (→ Vendeur)"}
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