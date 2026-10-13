"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { User, Store, Phone, MapPin, Cylinder, Settings, Shield, KeyRound, Plus, TrendingUp, CheckCircle2, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toggleVendorStatus, updateVendor, resetUserPassword, type ActionResult } from "@/app/admin/actions"
import { formatDate, formatDateTime } from "@/lib/gaz"
import { cn } from "@/lib/utils"
import { availabilityLabel, availabilityBadgeClass } from "@/lib/gaz"

type VendorProfile = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  image: string | null
  createdAt: Date | string
  updatedAt: Date | string
  emailVerified: boolean
  phoneVerified: boolean | null
}

type PointWithDispos = {
  id: string
  name: string
  district: string
  address: string
  phone: string | null
  brands: string[] | null
  formats: string[] | null
  disponibilites: {
    id: string
    status: string
    quantity: number | null
    format: string | null
    phone: string | null
    note: string | null
    createdAt: Date | string
    source: string
  }[]
}

export function AdminVendeurDetail({
  vendor,
  points,
}: {
  vendor: VendorProfile
  points: PointWithDispos[]
}) {
  const [, startTransition] = useTransition()
  const [dialog, setDialog] = useState<"edit" | "reset" | "toggle" | null>(null)
  const [feedback, setFeedback] = useState<ActionResult | null>(null)
  const [edit, setEdit] = useState({ name: vendor.name, phoneNumber: vendor.phoneNumber ?? "" })

  const handleToggle = () => {
    setFeedback(null)
    const formData = new FormData()
    formData.set("userId", vendor.id)
    formData.set("currentRole", vendor.role)
    startTransition(async () => {
      const result = await toggleVendorStatus(null, formData)
      setFeedback(result)
      if (result.ok) {
        setDialog(null)
        window.location.reload()
      }
    })
  }

  const handleSubmitEdit = (formData: FormData) => {
    formData.set("userId", vendor.id)
    setFeedback(null)
    startTransition(async () => {
      const result = await updateVendor(null, formData)
      setFeedback(result)
      if (result.ok) {
        setDialog(null)
        window.location.reload()
      }
    })
  }

  const handleReset = (formData: FormData) => {
    formData.set("userId", vendor.id)
    setFeedback(null)
    startTransition(async () => {
      const result = await resetUserPassword(null, formData)
      setFeedback(result)
    })
  }

  const totalPoints = points.length
  const totalDispos = points.reduce((sum, p) => sum + p.disponibilites.length, 0)
  const activeDispos = points.reduce(
    (sum, p) => sum + p.disponibilites.filter((d) => d.status === "disponible" && (d.quantity ?? 0) > 0).length,
    0
  )
  const totalQty = points.reduce(
    (sum, p) => sum + p.disponibilites.reduce((s, d) => s + (d.quantity ?? 0), 0),
    0
  )
  const lastUpdate = points
    .flatMap((p) => p.disponibilites.map((d) => new Date(d.createdAt)))
    .sort((a, b) => b.getTime() - a.getTime())[0]

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-6xl px-4">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Fiche vendeur</h1>
            <p className="mt-2 text-muted-foreground">Compte professionnel et dépôts rattachés</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 gap-1.5">
              <Store className="size-3" />
              Vendeur
            </Badge>
          </div>
        </header>

        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap items-center gap-4">
                <Avatar className="size-20">
                  <AvatarImage src={vendor.image ?? undefined} alt={vendor.name} />
                  <AvatarFallback className="bg-emerald-100 text-2xl font-semibold text-emerald-600">
                    {vendor.name?.charAt(0).toUpperCase() ?? "V"}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="truncate text-2xl font-semibold">{vendor.name}</p>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 gap-1.5">
                      <Store className="size-3" />
                      Vendeur
                    </Badge>
                  </div>
                  <p className="truncate text-sm text-muted-foreground">{vendor.email}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    Membre depuis le {formatDate(vendor.createdAt)}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  <Button
                    variant="outline"
                    nativeButton={false}
                    render={<Link href="/admin/points-de-vente" />}
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter un dépôt
                  </Button>
                  <Button variant="destructive" onClick={() => setDialog("toggle")}>
                    <Shield className="size-4 mr-2" />
                    Désactiver
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Dépôts rattachés</p>
                    <p className="text-3xl font-bold">{totalPoints}</p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <Store className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Disponibilités totales</p>
                    <p className="text-3xl font-bold">{totalDispos}</p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-full bg-blue-500/10 text-blue-600">
                    <Cylinder className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Disponibilités actives</p>
                    <p className="text-3xl font-bold text-emerald-600">{activeDispos}</p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                    <TrendingUp className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bouteilles totales</p>
                    <p className="text-3xl font-bold">{totalQty}</p>
                  </div>
                  <div className="flex size-12 items-center justify-center rounded-full bg-purple-500/10 text-purple-600">
                    <Cylinder className="size-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="depots" className="space-y-6">
            <TabsList aria-label="Sections vendeur">
              <TabsTrigger value="depots">Dépôts ({totalPoints})</TabsTrigger>
              <TabsTrigger value="disponibilites">Disponibilités ({totalDispos})</TabsTrigger>
              <TabsTrigger value="compte">Compte</TabsTrigger>
            </TabsList>

            <TabsContent value="depots" className="space-y-6">
              {points.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Store className="size-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium">Aucun dépôt rattaché</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Ajoutez un dépôt pour commencer à publier des disponibilités
                    </p>
                    <Button
                      className="mt-4"
                      variant="outline"
                      nativeButton={false}
                      render={<Link href="/admin/points-de-vente" />}
                    >
                      <Plus className="size-4 mr-2" />
                      Ajouter un dépôt
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {points.map((point) => (
                    <Card key={point.id}>
                      <CardHeader className="flex flex-row items-start justify-between pb-3">
                        <div>
                          <CardTitle className="flex items-center gap-2 text-base">
                            <Store className="size-4 text-primary" />
                            {point.name}
                          </CardTitle>
                          <CardDescription className="mt-1 flex items-center gap-1.5">
                            <MapPin className="size-3.5 shrink-0" />
                            {point.address} — {point.district}
                          </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            nativeButton={false}
                            render={<a href={`/admin/points-de-vente/${point.id}`} />}
                          >
                            <Cylinder className="size-3.5 mr-1.5" />
                            Disponibilités
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0 space-y-3">
                        {point.disponibilites.length === 0 ? (
                          <p className="text-sm text-muted-foreground py-4 text-center">
                            Aucune disponibilité enregistrée
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {point.disponibilites.map((dispo) => (
                              <div
                                key={dispo.id}
                                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border bg-card"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                      <span className="text-sm font-medium">{dispo.format ?? "—"}</span>
                                    </div>
                                    <div>
                                      <p className="font-medium text-foreground">
                                        {dispo.format ?? "Format non défini"}
                                      </p>
                                      <p className="text-xs text-muted-foreground">
                                        {formatDate(dispo.createdAt)}
                                        {dispo.quantity !== null && (
                                          <> · {dispo.quantity} bouteille{dispo.quantity > 1 ? "s" : ""}</>
                                        )}
                                        <span className="ml-2">
                                          <Badge
                                            variant="outline"
                                            className={availabilityBadgeClass[dispo.status as keyof typeof availabilityBadgeClass] ?? "bg-muted"}
                                          >
                                            {availabilityLabel[dispo.status as keyof typeof availabilityLabel] ?? dispo.status}
                                          </Badge>
                                        </span>
                                      </p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                                  {dispo.note && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1 flex-1 sm:flex-none">
                                      <MapPin className="size-3" />
                                      {dispo.note}
                                    </span>
                                  )}
                                  {dispo.phone && (
                                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                                      <Phone className="size-3" />
                                      {dispo.phone}
                                    </span>
                                  )}
                                  <Badge variant="outline" className="shrink-0">
                                    {dispo.source === "administration" ? "Admin" : "Vendeur"}
                                  </Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="disponibilites" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cylinder className="size-5 text-primary" />
                    Toutes les disponibilités
                  </CardTitle>
                  <CardDescription>Liste chronologique de tous les signalements</CardDescription>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const allDispos = points.flatMap((p) =>
                      p.disponibilites.map((d) => ({ ...d, pointName: p.name, pointDistrict: p.district }))
                    ).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

                    if (allDispos.length === 0) {
                      return (
                        <p className="text-sm text-muted-foreground text-center py-8">
                          Aucune disponibilité enregistrée
                        </p>
                      )
                    }

                    return (
                      <div className="space-y-2">
                        {allDispos.map((dispo) => (
                          <div
                            key={dispo.id}
                            className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 rounded-lg border bg-card"
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                              <div className="flex items-center gap-3">
                                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                  <span className="text-sm font-medium">{dispo.format ?? "—"}</span>
                                </div>
                                <div>
                                  <p className="font-medium text-foreground">
                                    {dispo.pointName} — {dispo.pointDistrict}
                                  </p>
                                  <p className="text-xs text-muted-foreground">
                                    {formatDate(dispo.createdAt)}
                                    {dispo.quantity !== null && (
                                      <> · {dispo.quantity} bouteille{dispo.quantity > 1 ? "s" : ""}</>
                                    )}
                                  </p>
                                </div>
                              </div>
                              <Badge
                                variant="outline"
                                className={availabilityBadgeClass[dispo.status as keyof typeof availabilityBadgeClass] ?? "bg-muted"}
                              >
                                {availabilityLabel[dispo.status as keyof typeof availabilityLabel] ?? dispo.status}
                              </Badge>
                            </div>
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                              {dispo.note && (
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <MapPin className="size-3" />
                                  {dispo.note}
                                </span>
                              )}
                              <Badge variant="outline" className="shrink-0">
                                {dispo.source === "administration" ? "Admin" : "Vendeur"}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="compte" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="size-5 text-primary" />
                    Informations du compte
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom</label>
                    <p className="font-medium">{vendor.name}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</label>
                    <a href={`mailto:${vendor.email}`} className="text-foreground hover:text-primary underline-offset-2 hover:underline">
                      {vendor.email}
                    </a>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone</label>
                    <p>{vendor.phoneNumber ?? <span className="text-muted-foreground">Non renseigné</span>}</p>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Rôle</label>
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 gap-1.5">
                      <Store className="size-3" />
                      Vendeur
                    </Badge>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email vérifié</label>
                    <Badge variant={vendor.emailVerified ? "default" : "outline"}>
                      {vendor.emailVerified ? "Vérifié" : "Non vérifié"}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone vérifié</label>
                    <Badge variant={vendor.phoneVerified ? "default" : "outline"}>
                      {vendor.phoneVerified ? "Vérifié" : "Non vérifié"}
                    </Badge>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">User ID</label>
                    <code className="font-mono text-sm break-all">{vendor.id}</code>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Créé le</label>
                    <p className="font-mono text-sm">{formatDateTime(vendor.createdAt)}</p>
                  </div>
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Dernière modification</label>
                    <p className="font-mono text-sm">{formatDateTime(vendor.updatedAt)}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="size-5 text-primary" />
                    Actions d&apos;administration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="outline" onClick={() => setDialog("edit")}>
                    <Settings className="size-4 mr-2" />
                    Modifier le profil
                  </Button>
                  <Button variant="destructive" onClick={() => setDialog("toggle")}>
                    <Shield className="size-4 mr-2" />
                    Désactiver (→ Usager)
                  </Button>
                  <Button variant="outline" onClick={() => setDialog("reset")}>
                    <KeyRound className="size-4 mr-2" />
                    Réinitialiser mot de passe
                  </Button>
                </div>

                {feedback && (
                  <div
                    className={cn(
                      "flex items-start gap-2 text-sm rounded-lg border px-3 py-2",
                      feedback.ok ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-red-700 bg-red-50 border-red-200"
                    )}
                  >
                    {feedback.ok ? <CheckCircle2 className="size-4 shrink-0 mt-0.5" /> : <X className="size-4 shrink-0 mt-0.5" />}
                    <span className="break-words">{feedback.message}</span>
                  </div>
                )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={dialog === "edit"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Modifier le profil</DialogTitle>
            <DialogDescription>Mise à jour du nom et du téléphone du vendeur</DialogDescription>
          </DialogHeader>
          <form action={handleSubmitEdit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-name">Nom / Responsable</Label>
              <Input id="vendor-name" name="name" value={edit.name} onChange={(e) => setEdit((s) => ({ ...s, name: e.target.value }))} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vendor-phone">Téléphone</Label>
              <Input id="vendor-phone" name="phoneNumber" value={edit.phoneNumber} onChange={(e) => setEdit((s) => ({ ...s, phoneNumber: e.target.value }))} placeholder="+237 6 99 00 00 00" />
            </div>
            {feedback && (
              <p role="alert" className={cn("text-sm break-words", feedback.ok ? "text-emerald-600" : "text-destructive")}>{feedback.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "toggle"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Désactiver (→ Usager)</DialogTitle>
            <DialogDescription>
              « {vendor.name} » perdra le rôle vendeur et redeviendra un usager classique.
            </DialogDescription>
          </DialogHeader>
          {feedback && (
            <p role="alert" className={cn("text-sm break-words", feedback.ok ? "text-emerald-600" : "text-destructive")}>{feedback.message}</p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
            <Button variant="destructive" onClick={handleToggle}>Confirmer</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "reset"} onOpenChange={(o) => { if (!o) setDialog(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Laissez vide pour générer un mot de passe temporaire aléatoire, ou saisissez un
              nouveau mot de passe (8 caractères minimum).
            </DialogDescription>
          </DialogHeader>
          <form action={handleReset} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="vendor-new-password">Nouveau mot de passe (facultatif)</Label>
              <Input id="vendor-new-password" name="newPassword" type="text" placeholder="Mot de passe temporaire" />
            </div>
            {feedback && (
              <p role="alert" className={cn("text-sm font-medium break-words", feedback.ok ? "text-emerald-600" : "text-destructive")}>{feedback.message}</p>
            )}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialog(null)}>Annuler</Button>
              <Button type="submit">Réinitialiser</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}