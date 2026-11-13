"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, User, AlertCircle, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"

interface AdminUser {
  id: string
  name: string
  email: string
  role: string
  phoneNumber: string | null
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
  approvalStatus: string | null
}

export default function AdminUsersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  useEffect(() => {
    let cancelled = false
    async function loadUsers() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (filterRole !== "all") params.set("role", filterRole)
        if (searchQuery) params.set("search", searchQuery)
        params.set("page", "1")
        params.set("pageSize", "50")

        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les utilisateurs")
        const data = await res.json()
        if (!cancelled) {
          setUsers(data.users ?? [])
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les utilisateurs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadUsers()
    return () => {
      cancelled = true
    }
  }, [filterStatus, filterRole, searchQuery])

  const toggleUserStatus = async (id: string, currentActive: boolean) => {
    const newActive = !currentActive
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      })
      if (!res.ok) throw new Error("Échec de la modification")
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: newActive } : u))
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const filteredUsers = users.filter((u) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return (
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      )
    }
    return true
  })

  const roleLabel = (role: string) => {
    switch (role) {
      case "client": return "Client"
      case "vendor": return "Vendeur"
      case "admin": return "Administrateur"
      case "collaborateur": return "Collaborateur"
      default: return role
    }
  }

  const roleColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-purple-50 text-purple-700 border-purple-100"
      case "vendor": return "bg-orange-50 text-orange-700 border-orange-100"
      case "client": return "bg-blue-50 text-blue-700 border-blue-100"
      default: return "bg-muted text-muted-foreground border-muted"
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Gestion des utilisateurs</h1>
        <Link href="/dashboard/admin">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" /> Retour
          </Button>
        </Link>
      </div>

      {error && (
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <AlertCircle className="size-4 mr-2 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>
            Consultez et gérez tous les comptes de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les rôles</SelectItem>
                <SelectItem value="client">Client</SelectItem>
                <SelectItem value="vendor">Vendeur</SelectItem>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="collaborateur">Collaborateur</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs (suspendus)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Users list */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Utilisateur</th>
                  <th className="text-left py-3 px-4">Rôle</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Téléphone</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Créé le</th>
                  <th className="text-right py-3 px-4">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-8 text-center text-muted-foreground">
                      Aucun utilisateur trouvé
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                            <User className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{u.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {u.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={roleColor(u.role)}>
                          {roleLabel(u.role)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {u.email}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {u.phoneNumber || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={
                            u.isActive ? "default" : "secondary"
                          }
                        >
                          {u.isActive ? "Actif" : "Suspendu"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {new Date(u.createdAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(u.id, u.isActive)}
                          disabled={saving.has(u.id)}
                        >
                          {u.isActive ? "Suspendre" : "Réactiver"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
