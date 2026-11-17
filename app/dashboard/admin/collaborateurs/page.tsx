"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Search, User, Plus, Shield, AlertCircle, ArrowLeft, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

const VALID_MODULES = [
  "utilisateurs",
  "clients",
  "vendeurs",
  "disponibilites",
  "reservations",
  "publicite",
  "collaborateurs",
  "marketing",
  "avis",
  "statistiques",
] as const

const MODULE_LABELS: Record<string, string> = {
  utilisateurs: "Utilisateurs (admin)",
  clients: "Clients",
  vendeurs: "Vendeurs",
  disponibilites: "Disponibilités",
  reservations: "Réservations",
  publicite: "Annonces & Publicité",
  collaborateurs: "Collaborateurs",
  marketing: "Marketing",
  avis: "Avis",
  statistiques: "Statistiques",
}

interface Collaborator {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  isActive: boolean
  emailVerified: boolean
  mustChangePassword: boolean
  createdAt: string | null
  updatedAt: string | null
  lastLoginAt: string | null
  permissions: string[]
}

interface CollaboratorStats {
  total: number
  active: number
  inactive: number
}

const createCollaboratorSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Format d'email invalide"),
  phoneNumber: z.string().optional().nullable(),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  permissions: z.array(z.string()).min(1, "Au moins une permission est requise"),
  isActive: z.boolean().default(true),
})

type CreateCollaboratorForm = z.infer<typeof createCollaboratorSchema>

export default function AdminCollaborateursPage() {
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [stats, setStats] = useState<CollaboratorStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState<Set<string>>(new Set())
  const [dialogOpen, setDialogOpen] = useState(false)

  // Form state
  const form = useForm<CreateCollaboratorForm>({
    resolver: zodResolver(createCollaboratorSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      permissions: [],
      isActive: true,
    },
  })

  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [showGeneratedPassword, setShowGeneratedPassword] = useState(false)
  const [generatedPassword, setGeneratedPassword] = useState("")

  // Load collaborators
  useEffect(() => {
    let cancelled = false
    async function loadCollaborators() {
      try {
        setLoading(true)
        const params = new URLSearchParams()
        if (filterStatus !== "all") params.set("status", filterStatus)
        if (searchQuery) params.set("search", searchQuery)
        params.set("page", "1")
        params.set("pageSize", "50")

        const res = await fetch(`/api/admin/collaborateurs?${params.toString()}`, {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger les collaborateurs")
        const data = await res.json()
        if (!cancelled) {
          setCollaborators(data.collaborators ?? [])
          setStats(data.stats ?? { total: 0, active: 0, inactive: 0 })
          setError(null)
        }
      } catch {
        if (!cancelled) setError("Impossible de charger les collaborateurs")
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadCollaborators()
    return () => {
      cancelled = true
    }
  }, [filterStatus, searchQuery])

  // Generate secure temporary password
  const generatePassword = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%"
    let password = ""
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setGeneratedPassword(password)
    form.setValue("password", password)
    setShowGeneratedPassword(true)
  }

  // Toggle collaborator status
  const toggleCollaboratorStatus = async (id: string, currentActive: boolean) => {
    const newActive = !currentActive
    setSaving((prev) => new Set([...prev, id]))
    try {
      const res = await fetch(`/api/admin/collaborateurs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: newActive }),
      })
      if (!res.ok) throw new Error("Échec de la modification")
      setCollaborators((prev) =>
        prev.map((c) => (c.id === id ? { ...c, isActive: newActive } : c))
      )
      // Update stats
      setStats((prev) =>
        prev
          ? {
              ...prev,
              active: prev.active + (newActive ? 1 : -1),
              inactive: prev.inactive + (newActive ? -1 : 1),
            }
          : null
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

  // Reset collaborator password (generate new temporary password)
  const resetCollaboratorPassword = async (id: string) => {
    const newTempPassword = Array.from({ length: 12 }, () =>
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%".charAt(
        Math.floor(Math.random() * "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%".length)
      )
    ).join("")

    try {
      // First update the password in better-auth account table
      const res = await fetch(`/api/admin/collaborateurs/${id}/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newTempPassword }),
      })
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Échec de la réinitialisation")
      }

      // Then mark mustChangePassword = true
      const patchRes = await fetch(`/api/admin/collaborateurs/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mustChangePassword: true }),
      })
      if (!patchRes.ok) throw new Error("Échec de la mise à jour du statut")

      setCollaborators((prev) =>
        prev.map((c) =>
          c.id === id ? { ...c, mustChangePassword: true } : c
        )
      )

      alert(
        `Mot de passe temporaire réinitialisé : ${newTempPassword}\n\n` +
        "Communiquez ce mot de passe au collaborateur de manière sécurisée."
      )
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erreur lors de la réinitialisation")
    }
  }

  // Submit form
  const onSubmit = async (data: CreateCollaboratorForm) => {
    setFormLoading(true)
    setFormError(null)

    try {
      const res = await fetch("/api/admin/collaborateurs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        setFormError(result.error || "Erreur lors de la création")
        return
      }

      // Success
      setDialogOpen(false)
      form.reset({
        name: "",
        email: "",
        phoneNumber: "",
        password: "",
        permissions: [],
        isActive: true,
      })
      setShowGeneratedPassword(false)
      setGeneratedPassword("")

      // Reload list
      const params = new URLSearchParams()
      if (filterStatus !== "all") params.set("status", filterStatus)
      if (searchQuery) params.set("search", searchQuery)
      params.set("page", "1")
      params.set("pageSize", "50")

      const listRes = await fetch(`/api/admin/collaborateurs?${params.toString()}`, {
        headers: { Accept: "application/json" },
        cache: "no-store",
      })
      if (listRes.ok) {
        const listData = await listRes.json()
        setCollaborators(listData.collaborators ?? [])
        setStats(listData.stats ?? { total: 0, active: 0, inactive: 0 })
      }
    } catch {
      setFormError("Erreur lors de la création du collaborateur")
    } finally {
      setFormLoading(false)
    }
  }

  const roleColor = (role: string) => {
    switch (role) {
      case "collaborateur":
        return "bg-purple-50 text-purple-700 border-purple-100"
      default:
        return "bg-muted text-muted-foreground border-muted"
    }
  }

  const permissionLabels = (perms: string[]) =>
    perms.map((p) => MODULE_LABELS[p] || p).join(", ")

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
          <h1 className="text-2xl font-bold tracking-tight">Gestion des collaborateurs</h1>
          <p className="text-muted-foreground">
            Créez et gérez les comptes collaborateurs avec leurs permissions
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4 mr-2" />
              Nouveau collaborateur
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Créer un collaborateur</DialogTitle>
              <DialogDescription>
                Remplissez les informations ci-dessous. Un mot de passe temporaire sera généré
                ou vous pouvez en définir un. Le collaborateur devra le changer à sa première connexion.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {formError && (
                  <div
                    className="rounded-md bg-destructive/10 p-3 text-sm text-destructive flex items-center gap-2"
                    role="alert"
                  >
                    <AlertCircle className="size-4 shrink-0" />
                    {formError}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom complet</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Jean Dupont"
                          {...field}
                          disabled={formLoading}
                        />
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
                        <Input
                          type="email"
                          placeholder="collaborateur@gazpoints.cm"
                          {...field}
                          disabled={formLoading}
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
                      <FormLabel>Téléphone (optionnel)</FormLabel>
                      <FormControl>
                        <Input
                          type="tel"
                          placeholder="+237 6XX XX XX XX"
                          {...field}
                          disabled={formLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mot de passe temporaire</FormLabel>
                      <FormControl>
                        <div className="flex gap-2">
                          <Input
                            type={showGeneratedPassword ? "text" : "password"}
                            {...field}
                            disabled={formLoading}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={generatePassword}
                            disabled={formLoading}
                            className="h-10"
                          >
                            Générer
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                      {showGeneratedPassword && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Mot de passe généré : <code className="bg-muted px-1 rounded">{generatedPassword}</code>
                        </p>
                      )}
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="permissions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Permissions (modules accessibles)</FormLabel>
                      <FormControl>
                        <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto p-2 border rounded-md">
                          {VALID_MODULES.map((module) => (
                            <label
                              key={module}
                              className={cn(
                                "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors cursor-pointer",
                                field.value.includes(module)
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "text-muted-foreground hover:bg-muted"
                              )}
                            >
                              <input
                                type="checkbox"
                                checked={field.value.includes(module)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    field.onChange([...field.value, module])
                                  } else {
                                    field.onChange(field.value.filter((m) => m !== module))
                                  }
                                }}
                                className="size-4 rounded border-border text-primary focus:ring-primary"
                                disabled={formLoading}
                              />
                              <span className="font-medium">{MODULE_LABELS[module]}</span>
                            </label>
                          ))}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-2">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={(e) => field.onChange(e.target.checked)}
                          className="size-4 rounded border-border text-primary focus:ring-primary"
                          disabled={formLoading}
                        />
                      </FormControl>
                      <FormLabel className="mb-0 cursor-pointer">Compte actif</FormLabel>
                    </FormItem>
                  )}
                />

                <DialogFooter className="gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false)
                      form.reset({
                        name: "",
                        email: "",
                        phoneNumber: "",
                        password: "",
                        permissions: [],
                        isActive: true,
                      })
                      setShowGeneratedPassword(false)
                      setGeneratedPassword("")
                    }}
                    disabled={formLoading}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={formLoading} loading={formLoading}>
                    {formLoading ? "Création..." : "Créer le collaborateur"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Card className="border border-destructive/20 bg-destructive/5">
          <CardContent className="p-4">
            <AlertCircle className="size-4 mr-2 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Total collaborateurs
            </p>
            <p className="text-2xl font-bold text-foreground mt-1">{stats?.total ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Actifs
            </p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats?.active ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-5 text-center">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Suspendus
            </p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats?.inactive ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Collaborators list */}
      <Card>
        <CardHeader>
          <CardTitle>Collaborateurs</CardTitle>
          <CardDescription>Liste des comptes collaborateurs et leurs permissions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Suspendus</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-muted-foreground border-b">
                  <th className="text-left py-3 px-4">Collaborateur</th>
                  <th className="text-left py-3 px-4">Email</th>
                  <th className="text-left py-3 px-4">Téléphone</th>
                  <th className="text-left py-3 px-4">Statut</th>
                  <th className="text-left py-3 px-4">Mot de passe temporaire</th>
                  <th className="text-left py-3 px-4">Permissions</th>
                  <th className="text-left py-3 px-4">Créé le</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {collaborators.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="py-8 text-center text-muted-foreground">
                      Aucun collaborateur trouvé
                    </td>
                  </tr>
                ) : (
                  collaborators.map((c) => (
                    <tr key={c.id} className="border-b">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="flex size-8 items-center justify-center rounded-full bg-purple-100 text-purple-700">
                            <User className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{c.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {c.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{c.email}</td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {c.phoneNumber || "—"}
                      </td>
                      <td className="py-3 px-4">
                        <Badge
                          variant={c.isActive ? "default" : "secondary"}
                        >
                          {c.isActive ? "Actif" : "Suspendu"}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {c.mustChangePassword ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-100">
                            Oui (changement requis)
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-100">
                            Non
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 max-w-xs">
                        <div className="flex items-center gap-1 flex-wrap">
                          {c.permissions.length === 0 ? (
                            <span className="text-xs text-muted-foreground">Aucune</span>
                          ) : (
                            c.permissions.map((p) => (
                              <Badge
                                key={p}
                                variant="outline"
                                className="text-xs px-2 py-0.5"
                              >
                                {MODULE_LABELS[p] || p}
                              </Badge>
                            ))
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {c.createdAt
                          ? new Date(c.createdAt).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                            })
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleCollaboratorStatus(c.id, c.isActive)}
                            disabled={saving.has(c.id)}
                          >
                            {c.isActive ? "Suspendre" : "Réactiver"}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => resetCollaboratorPassword(c.id)}
                            disabled={saving.has(c.id)}
                          >
                            <Shield className="size-3.5 mr-1" />
                            Réinitialiser MDP
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
    </div>
  )
}