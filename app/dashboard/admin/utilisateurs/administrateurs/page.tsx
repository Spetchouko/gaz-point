"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  Search,
  User,
  AlertCircle,
  ArrowLeft,
  Trash2,
  ShieldAlert,
  Loader2,
  Mail,
  Phone,
  Calendar,
  Eye,
  CheckCircle2,
  XCircle,
  Building2,
  UserCog,
  Activity,
} from "lucide-react"
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
import { Separator } from "@/components/ui/separator"

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

const RoleIcons: Record<string, React.ElementType> = {
  client: User,
  vendor: Building2,
  admin: ShieldAlert,
  collaborateur: UserCog,
}

function RoleIcon({ role, className }: { role: string; className?: string }) {
  const Icon = RoleIcons[role] ?? User
  return <Icon className={className} aria-hidden="true" />
}

const roleColor = (role: string) => {
  switch (role) {
    case "admin": return "bg-primary/10 text-primary border-primary/30"
    case "vendor": return "bg-warning/10 text-warning-strong border-warning/30"
    case "client": return "bg-info/10 text-info-strong border-info/30"
    case "collaborateur": return "bg-secondary text-secondary-foreground border-border"
    default: return "bg-muted text-muted-foreground border-muted"
  }
}

const roleHoverColor = (role: string) => {
  switch (role) {
    case "admin": return "group-hover:bg-primary group-hover:text-primary-foreground"
    case "vendor": return "group-hover:bg-warning group-hover:text-warning-foreground"
    case "client": return "group-hover:bg-info group-hover:text-info-foreground"
    case "collaborateur": return "group-hover:bg-secondary group-hover:text-secondary-foreground"
    default: return "group-hover:bg-muted group-hover:text-muted-foreground"
  }
}

function formatDate(dateString: string | null, withTime = false) {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  })
}

function formatDateFull(dateString: string | null) {
  if (!dateString) return "—"
  return new Date(dateString).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  })
}

const STAT_CARDS_CONFIG = [
  { label: "Clients", color: "bg-info/10 text-info-strong border-info/30", hover: "group-hover:bg-info group-hover:text-info-foreground", icon: User, role: "client" },
  { label: "Vendeurs", color: "bg-warning/10 text-warning-strong border-warning/30", hover: "group-hover:bg-warning group-hover:text-warning-foreground", icon: Building2, role: "vendor" },
  { label: "Administrateurs", color: "bg-primary/10 text-primary border-primary/30", hover: "group-hover:bg-primary group-hover:text-primary-foreground", icon: ShieldAlert, role: "admin" },
  { label: "Collaborateurs", color: "bg-secondary text-secondary-foreground border-border", hover: "group-hover:bg-secondary group-hover:text-secondary-foreground", icon: UserCog, role: "collaborateur" },
  { label: "Total", color: "bg-primary text-primary-foreground border-primary/20", hover: "group-hover:bg-primary/90", icon: User, role: "all" },
]

function StatCard({ stat, value, currentRole, onClick }: { stat: typeof STAT_CARDS_CONFIG[0]; value: number; currentRole: string; onClick?: () => void }) {
  const isActive = currentRole === stat.role
  const rolePathMap: Record<string, string> = {
    client: "clients",
    vendor: "vendeurs",
    admin: "administrateurs",
    collaborateur: "collaborateurs",
    all: "tous",
  }
  const href = stat.role === "all" 
    ? "/dashboard/admin/utilisateurs/tous" 
    : `/dashboard/admin/utilisateurs/${rolePathMap[stat.role]}`
  return (
    <Link
      key={stat.label}
      href={href}
      className={cn(
        "group p-3 flex flex-col items-center transition-all duration-300 shadow-sm hover:shadow-lg hover:-translate-y-0.5 border-0 bg-card no-underline",
        isActive && "ring-2 ring-primary/30",
        "focus:outline-none focus:ring-2 focus:ring-primary/20 rounded-xl"
      )}
      aria-label={`Filtrer par ${stat.label} (${value})`}
      onClick={onClick}
    >
      <CardContent className="p-0 flex flex-col items-center w-full">
        <div
          className={cn(
            "size-10 rounded-lg flex items-center justify-center mb-2 transition-all duration-300",
            stat.color,
            stat.hover
          )}
        >
          <stat.icon className="size-5 transition-transform duration-300 group-hover:scale-110" />
        </div>
        <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
        <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
          {stat.label}
        </div>
      </CardContent>
    </Link>
  )
}

export default function AdminUsersPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
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
  const [viewDialog, setViewDialog] = useState(false)
  const [viewUser, setViewUser] = useState<AdminUser | null>(null)

  const form = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
    defaultValues: { name: "", email: "", phoneNumber: null, role: "client", isActive: true },
  })

  // Get the fixed role from the URL path
  const pathRole = (() => {
    if (typeof window !== "undefined") {
      const path = window.location.pathname
      if (path.includes("/clients")) return "client"
      if (path.includes("/vendeurs")) return "vendor"
      if (path.includes("/administrateurs")) return "admin"
      if (path.includes("/collaborateurs")) return "collaborateur"
    }
    return "all"
  })()

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (searchQuery) params.set("search", searchQuery)
        // Force the role filter based on the page
        if (pathRole !== "all") {
          params.set("role", pathRole)
        }
        params.set("page", "1")
        params.set("pageSize", "100")

        const res = await fetch(`/api/admin/users?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
          credentials: "include",
        })
        if (!res.ok) throw new Error("Impossible de charger les utilisateurs")
        const data = await res.json()
        if (!cancelled) {
          const fetchedUsers = data.users ?? []
          setUsers(fetchedUsers)
          const computedStats = fetchedUsers.reduce(
            (acc: UserStats, u: AdminUser) => {
              acc.total++
              if (u.role === "client") acc.clients++
              else if (u.role === "vendor") acc.vendors++
              else if (u.role === "admin") acc.admins++
              else if (u.role === "collaborateur") acc.collaborateurs++
              return acc
            },
            { total: 0, clients: 0, vendors: 0, admins: 0, collaborateurs: 0 }
          )
          setStats(computedStats)
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les utilisateurs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [filterStatus, searchQuery, pathRole])

  const handleToggleUserStatus = async (id: string, currentActive: boolean) => {
    const newActive = !currentActive
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/admin/users/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
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
        credentials: "include",
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
        credentials: "include",
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
  })

  // Page titles and descriptions based on role
  const pageConfig = {
    client: { title: "Clients", description: "Liste de tous les clients enregistrés sur la plateforme" },
    vendor: { title: "Vendeurs", description: "Liste de tous les vendeurs enregistrés sur la plateforme" },
    admin: { title: "Administrateurs", description: "Liste de tous les administrateurs de la plateforme" },
    collaborateur: { title: "Collaborateurs", description: "Liste de tous les collaborateurs de la plateforme" },
    all: { title: "Tous les utilisateurs", description: "Liste de tous les comptes de la plateforme" },
  }

  const currentConfig = pageConfig[pathRole as keyof typeof pageConfig] || pageConfig.all
    
  if (loading) {
    return (
      <div className="admin-section">
        <div className="flex flex-col items-center justify-center py-12">
          <Spinner size="lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">{currentConfig.title}</h1>
          <p className="admin-page-subtitle">{currentConfig.description}</p>
        </div>
        <Link href="/dashboard/admin/utilisateurs">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" /> Retour à la gestion
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

      {/* Statistiques - Cartes compactes en deux rangées */}
      <section className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 mb-6">
        {STAT_CARDS_CONFIG.map((stat) => (
          <StatCard
            key={stat.label}
            stat={stat}
            value={stats[stat.role === "all" ? "total" : stat.role === "client" ? "clients" : stat.role === "vendor" ? "vendors" : stat.role === "admin" ? "admins" : "collaborateurs"]}
            currentRole={pathRole}
          />
        ))}
      </section>

      {/* Liste des utilisateurs - Cartes responsive */}
      <Card className="border border-border shadow-sm">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>{currentConfig.title}</CardTitle>
              <CardDescription>
                {filteredUsers.length} sur {stats.total} comptes • Cliquez pour voir les détails
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom ou email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={filterStatus as string | null} onValueChange={(value) => setFilterStatus(value ?? "all")}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs (suspendus)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4">
              <User className="size-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground text-center">Aucun utilisateur trouvé</p>
              <p className="text-xs text-muted-foreground/60 mt-1">
                Essayez de modifier vos filtres ou votre recherche
              </p>
            </div>
          ) : (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredUsers.map((u) => (
                <article
                  key={u.id}
                  className={cn(
                    "group relative bg-card/50 rounded-xl border border-border p-4 transition-all duration-300",
                    "hover:shadow-lg hover:border-primary/30 hover:bg-card hover:-translate-y-1",
                    "cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/20",
                    !u.isActive && "opacity-60 bg-muted/30"
                  )}
                  onClick={() => { setViewUser(u); setViewDialog(true); }}
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setViewUser(u); setViewDialog(true); } }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={cn(
                        "size-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-300",
                        roleColor(u.role),
                        roleHoverColor(u.role)
                      )}
                    >
                      <RoleIcon role={u.role} className="size-5 transition-transform duration-300 group-hover:scale-110" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-foreground truncate">{u.name}</p>
                        <Badge variant="outline" className={cn(roleColor(u.role), "text-xs")}>
                          {roleLabel(u.role)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground truncate mt-0.5">{u.email}</p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          {u.phoneNumber ? (
                            <>
                              <Phone className="size-3" />
                              <span>{u.phoneNumber}</span>
                            </>
                          ) : (
                            <>
                              <Phone className="size-3 opacity-30" />
                              <span className="opacity-30">—</span>
                            </>
                          )}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3" />
                          <span>{formatDate(u.createdAt)}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10"
                      onClick={(e) => { e.stopPropagation(); setViewUser(u); setViewDialog(true); }}
                      aria-label="Voir détails"
                    >
                      <Eye className="size-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-warning hover:bg-warning/10"
                      onClick={(e) => { e.stopPropagation(); handleToggleUserStatus(u.id, u.isActive); }}
                      aria-label={u.isActive ? "Suspendre" : "Réactiver"}
                      disabled={saving.has(u.id)}
                    >
                      {u.isActive ? <XCircle className="size-4" /> : <CheckCircle2 className="size-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={(e) => { e.stopPropagation(); setDeleteUser(u); setDeleteDialog(true); }}
                      aria-label="Supprimer"
                      disabled={saving.has(u.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border/50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant={u.isActive ? "default" : "secondary"} className="text-xs">
                        {u.isActive ? <CheckCircle2 className="size-3 mr-1" /> : <XCircle className="size-3 mr-1" />}
                        {u.isActive ? "Actif" : "Suspendu"}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {u.emailVerified ? <CheckCircle2 className="size-3 mr-1 text-success" /> : <XCircle className="size-3 mr-1 text-destructive" />}
                        {u.emailVerified ? "Email vérifié" : "Email non vérifié"}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {u.lastLoginAt ? `Dernière connexion : ${formatDateFull(u.lastLoginAt)}` : "Jamais connecté"}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Voir détails */}
      <Dialog open={viewDialog} onOpenChange={setViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Détails du compte</span>
              <Badge variant="outline" className={roleColor(viewUser?.role ?? "")}>
                {viewUser ? roleLabel(viewUser.role) : ""}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Informations complètes de l&apos;utilisateur
            </DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="space-y-6 py-4">
              <div className="flex items-center gap-4 p-4 bg-muted/30 rounded-xl">
                <div
                  className={cn("size-16 rounded-xl flex items-center justify-center", roleColor(viewUser.role))}
                >
                  <RoleIcon role={viewUser.role} className="size-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground">{viewUser.name}</h3>
                  <p className="text-muted-foreground">{viewUser.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={viewUser.isActive ? "default" : "secondary"}>
                      {viewUser.isActive ? "Actif" : "Suspendu"}
                    </Badge>
                    <Badge variant="outline">
                      {viewUser.emailVerified ? "Email vérifié" : "Email non vérifié"}
                    </Badge>
                    <Badge variant="outline" className={roleColor(viewUser.role)}>
                      {roleLabel(viewUser.role)}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Mail className="size-4 text-muted-foreground" />
                    Coordonnées
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Email</dt>
                      <dd className="text-foreground font-medium break-all">{viewUser.email}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Téléphone</dt>
                      <dd className="text-foreground font-medium">{viewUser.phoneNumber || "Non renseigné"}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Calendar className="size-4 text-muted-foreground" />
                    Dates importantes
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Inscription</dt>
                      <dd className="text-foreground font-medium">{formatDateFull(viewUser.createdAt)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Dernière connexion</dt>
                      <dd className="text-foreground font-medium">
                        {viewUser.lastLoginAt ? formatDateFull(viewUser.lastLoginAt) : "Jamais"}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Statut email</dt>
                      <dd className="text-foreground font-medium flex items-center gap-1">
                        {viewUser.emailVerified ? (
                          <>
                            <CheckCircle2 className="size-3 text-success" />
                            Vérifié
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3 text-destructive" />
                            Non vérifié
                          </>
                        )}
                      </dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <UserCog className="size-4 text-muted-foreground" />
                    Compte
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Rôle</dt>
                      <dd className="text-foreground font-medium">
                        <Badge variant="outline" className={roleColor(viewUser.role)}>
                          {roleLabel(viewUser.role)}
                        </Badge>
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Statut</dt>
                      <dd className="text-foreground font-medium flex items-center gap-1">
                        {viewUser.isActive ? (
                          <>
                            <CheckCircle2 className="size-3 text-success" />
                            Actif
                          </>
                        ) : (
                          <>
                            <XCircle className="size-3 text-destructive" />
                            Suspendu
                          </>
                        )}
                      </dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">ID</dt>
                      <dd className="text-foreground font-mono text-xs break-all">{viewUser.id}</dd>
                    </div>
                  </dl>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <Activity className="size-4 text-muted-foreground" />
                    Approbation vendeur
                  </h4>
                  <dl className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-muted-foreground">Statut</dt>
                      <dd className="text-foreground font-medium capitalize">
                        {viewUser.approvalStatus || "Non applicable"}
                      </dd>
                    </div>
                    {viewUser.approvalStatus && viewUser.approvalStatus !== "none" && (
                      <>
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Demandé le</dt>
                          <dd className="text-foreground font-medium">
                            {viewUser.approvalStatus === "pending" ? "En attente" : formatDate(viewUser.createdAt)}
                          </dd>
                        </div>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-end gap-3">
                <Button variant="outline" onClick={() => { setViewDialog(false); setEditUser(viewUser); form.reset({ name: viewUser.name, email: viewUser.email, phoneNumber: viewUser.phoneNumber, role: viewUser.role as RoleFormValues["role"], isActive: viewUser.isActive }); setEditDialog(true); }}>
                  Modifier
                </Button>
                <Button variant="destructive" onClick={() => { setViewDialog(false); setDeleteUser(viewUser); setDeleteDialog(true); }}>
                  <Trash2 className="size-4 mr-2" /> Supprimer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog Modifier utilisateur */}
      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier l&apos;utilisateur</DialogTitle>
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
                    <FormLabel>Adresse e-mail (non modifiable)</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        {...field}
                        readOnly
                        aria-readonly="true"
                        className="bg-muted/50"
                      />
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
                <Button type="button" variant="outline" onClick={() => { setEditDialog(false); setEditUser(null); }}>
                  Annuler
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting || saving.has(editUser?.id ?? "")}>
                  {form.formState.isSubmitting ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                  Enregistrer
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Dialog Suppression */}
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
            <Button type="button" variant="outline" onClick={() => { setDeleteDialog(false); setDeleteUser(null); }}>
              Annuler
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={saving.has(deleteUser?.id ?? "")}
            >
              {deleteUser ? (saving.has(deleteUser.id) ? <Loader2 className="size-4 mr-2 animate-spin" /> : null) : null}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}