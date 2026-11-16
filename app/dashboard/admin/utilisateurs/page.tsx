"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { Search, User, AlertCircle, ArrowLeft, Trash2, ShieldAlert, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"
import { toast } from "sonner"

const roleSchema = z.object({
  name: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  phoneNumber: z.string().nullable().optional(),
  role: z.enum(["client", "vendor", "admin", "collaborateur"]),
  isActive: z.boolean(),
})

type RoleFormValues = z.infer<typeof roleSchema>

interface AdminUser {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  createdAt: string
  lastLoginAt: string | null
  approvalStatus: string | null
}

interface UserStats {
  total: number
  clients: number
  vendors: number
  admins: number
  collaborateurs: number
}

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
    case "collaborateur": return "bg-indigo-50 text-indigo-700 border-indigo-100"
    default: return "bg-muted text-muted-foreground border-muted"
  }
}

export default function AdminUsersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [filterRole, setFilterRole] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [users, setUsers] = useState<AdminUser[]>([])
  const [stats, setStats] = useState<UserStats>({
    total: 0, clients: 0, vendors: 0, admins: 0, collaborateurs: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())

  const [editDialog, setEditDialog] = useState(false)
  const [editUser, setEditUser] = useState<AdminUser | null>(null)
  const [deleteDialog, setDeleteDialog] = useState(false)
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", email: "", phoneNumber: null, role: "client", isActive: true },
  })

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
          setStats(data.stats ?? { total: 0, clients: 0, vendors: 0, admins: 0, collaborateurs: 0 })
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
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || "Échec de la modification")
      }
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, isActive: newActive } : u))
      )
      toast.success(`Compte ${newActive ? "réactivé" : "suspendu"} avec succès`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }
  }

  const handleEditSubmit = async (values: RoleFormValues) => {
    if (!editUser) return
    setSaving((prev) => new Set([...prev, editUser.id]))
    try {
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          phoneNumber: values.phoneNumber || null,
          role: values.role,
          isActive: values.isActive,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Échec de la modification")
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editUser!.id
            ? {
                ...u,
                name: values.name,
                email: values.email,
                phoneNumber: values.phoneNumber,
                role: values.role,
                isActive: values.isActive,
              }
            : u
        )
      )
      setEditDialog(false)
      form.reset()
      toast.success("Utilisateur mis à jour avec succès")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la modification")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(editUser!.id)
        return next
      })
    }
  }

  const handleDelete = async () => {
    if (!deleteUser) return
    setSaving((prev) => new Set([...prev, deleteUser.id]))
    try {
      const res = await fetch(`/api/admin/users/${deleteUser.id}`, {
        method: "DELETE",
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Échec de la suppression")
      setUsers((prev) => prev.filter((u) => u.id !== deleteUser!.id))
      setStats((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }))
      setDeleteDialog(false)
      toast.success("Compte supprimé avec succès")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erreur lors de la suppression")
    } finally {
      setSaving((prev) => {
        const next = new Set(prev)
        next.delete(deleteUser!.id)
        return next
      })
    }
  }

  const filteredUsers = users.filter((u) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    }
    return true
  }).filter((u) => {
    if (filterStatus === "active") return u.isActive
    if (filterStatus === "inactive") return !u.isActive
    return true
  }).filter((u) => {
    if (filterRole !== "all") return u.role === filterRole
    return true
  })

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "—"
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    })
  }

  const statCards = [
    { label: "Clients", value: stats.clients, color: "bg-blue-50 text-blue-700 border-blue-100", role: "client" },
    { label: "Vendeurs", value: stats.vendors, color: "bg-orange-50 text-orange-700 border-orange-100", role: "vendor" },
    { label: "Administrateurs", value: stats.admins, color: "bg-purple-50 text-purple-700 border-purple-100", role: "admin" },
    { label: "Collaborateurs", value: stats.collaborateurs, color: "bg-indigo-50 text-indigo-700 border-indigo-100", role: "collaborateur" },
    { label: "Total", value: stats.total, color: "bg-primary text-primary-foreground border-primary/20", role: "all" },
  ]

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
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des utilisateurs</h1>
          <p className="text-muted-foreground text-sm">
            Consultez et gérez tous les comptes de la plateforme
          </p>
        </div>
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
          <CardTitle>Statistiques des comptes</CardTitle>
          <CardDescription>
            Répartition réelle des utilisateurs enregistrés dans Neon
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 border-t border-border">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className={cn(
                  "p-4 flex flex-col items-center border-b border-border last:border-b-0",
                  stat.role === "all" ? "border-l border-border" : ""
                )}
              >
                <div className={`size-10 rounded-lg flex items-center justify-center mb-3 ${stat.color}`}>
                  <User className="size-5" />
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Utilisateurs</CardTitle>
          <CardDescription>
            Consultez, modifiez et gérez tous les comptes de la plateforme
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <Select value={filterRole as string | null} onValueChange={(value) => setFilterRole(value ?? "all")}>
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
            <Select value={filterStatus as string | null} onValueChange={(value) => setFilterStatus(value ?? "all")}>
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

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Utilisateur</th>
                  <th className="text-left py-3 px-4">Rôle</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Téléphone</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Email vérifié</th>
                  <th className="text-left py-3 px-4">Créé le</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-muted-foreground">
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
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline" className={roleColor(u.role)}>
                          {roleLabel(u.role)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{u.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">{u.phoneNumber || "—"}</td>
                      <td className="py-3 px-4">
                        <Badge variant={u.isActive ? "default" : "secondary"}>
                          {u.isActive ? "Actif" : "Suspendu"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant="outline">{u.emailVerified ? "Oui" : "Non"}</Badge>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {formatDate(u.createdAt)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditUser(u)
                              form.reset({
                                name: u.name,
                                email: u.email,
                                phoneNumber: u.phoneNumber,
                                role: u.role as any,
                                isActive: u.isActive,
                              })
                              setEditDialog(true)
                            }}
                            disabled={saving.has(u.id)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setDeleteUser(u)
                              setDeleteDialog(true)
                            }}
                            disabled={saving.has(u.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleUserStatus(u.id, u.isActive)}
                            disabled={saving.has(u.id)}
                          >
                            {u.isActive ? "Suspendre" : "Réactiver"}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Dialog modifier utilisateur */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations du compte. Les changements sont enregistrés en base.
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleEditSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse e-mail</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phoneNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Numéro de téléphone</FormLabel>
                    <FormControl>
                      <Input type="tel" {...field} placeholder="+237 ..." />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Rôle</FormLabel>
                    <FormControl>
                      <Select {...field} onValueChange={field.onChange}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Sélectionner un rôle" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="client">Client</SelectItem>
                          <SelectItem value="vendor">Vendeur</SelectItem>
                          <SelectItem value="admin">Administrateur</SelectItem>
                          <SelectItem value="collaborateur">Collaborateur</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Compte actif</FormLabel>
                    <FormControl>
                      <input type="checkbox" {...field} className="accent-primary" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditDialog(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || saving.has(editUser!.id)}>
                  {form.formState.isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog suppression */}
      <Dialog open={deleteDialog} onOpenChange={setDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer le compte</DialogTitle>
            <DialogDescription>
              {deleteUser ? (
                <>
                  Êtes-vous sûr de vouloir supprimer le compte <strong>{deleteUser.name}</strong> ({deleteUser.email}) ?
                  <br />
                  <span className="text-sm text-muted-foreground mt-2 block">
                    Cette action est irréversible. Si le compte est lié à des données métier (réservations, points de vente, disponibilités), la suppression sera refusée pour protéger ces données.
                  </span>
                </>
              ) : null}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteDialog(false)}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving.has(deleteUser!.id)}
            >
              {saving.has(deleteUser!.id) ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
