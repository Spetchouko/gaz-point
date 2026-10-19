"use client"

import { useState } from "react"
import { ImageUp, KeyRound, ShieldCheck, Trash2, UserRound, Eye, EyeOff } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"

type ProfileData = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  role: string
  image: string | null
  createdAt: Date
}

type Feedback = { ok: boolean; message: string } | null
type StaffRole = "admin" | "collaborateur"

export function AdminProfilEditor({ profile, role }: { profile: ProfileData; role: StaffRole }) {
  const { refetch } = authClient.useSession()
  const [avatar, setAvatar] = useState<string | null>(profile.image)

  const roleLabel = role === "collaborateur" ? "Collaborateur" : "Administrateur"

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Mon profil</h1>
        <p className="mt-2 text-muted-foreground">
          {role === "collaborateur"
            ? "Vos informations personnelles et la sécurité de votre compte collaborateur."
            : "Vos informations personnelles et la sécurité de votre compte administrateur."}
        </p>
      </header>

      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-wrap items-center gap-4 pt-6">
            <Avatar className="size-16">
              <AvatarImage
                src={avatar ?? undefined}
                alt={profile.name}
              />
              <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
                {profile.name?.charAt(0).toUpperCase() ?? "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-lg font-semibold">{profile.name}</p>
                <span className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full">
                  {roleLabel}
                </span>
              </div>
              <p className="truncate text-sm text-muted-foreground">
                {profile.email}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Membre depuis le {profile.createdAt.toLocaleDateString("fr-FR")}
              </p>
            </div>
          </CardContent>
        </Card>

        <FormulaireAvatar
          profile={profile}
          onChanged={setAvatar}
          onUpdated={() => refetch()}
        />

        <FormulaireInformations
          profile={profile}
          onUpdated={() => refetch()}
        />

        <FormulaireMotDePasse />
      </div>
    </div>
  )
}

function FormulaireAvatar({
  profile,
  onChanged,
  onUpdated,
}: {
  profile: ProfileData
  onChanged: (image: string | null) => void
  onUpdated: () => void
}) {
  const [preview, setPreview] = useState<string | null>(profile.image)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [loading, setLoading] = useState(false)

  const pickFile = (file: File | undefined) => {
    setFeedback(null)
    if (!file) return
    if (!file.type.startsWith("image/")) {
      setFeedback({ ok: false, message: "Le fichier choisi n'est pas une image." })
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setFeedback({ ok: false, message: "Image trop lourde (2 Mo maximum)." })
      return
    }
    const reader = new FileReader()
    reader.onload = () => setPreview(String(reader.result ?? ""))
    reader.readAsDataURL(file)
  }

  const save = async (image: string | null) => {
    setFeedback(null)
    setLoading(true)
    const { error } = await authClient.updateUser({
      image,
    } as Parameters<typeof authClient.updateUser>[0])
    setLoading(false)
    if (error) {
      setFeedback({ ok: false, message: error.message || "La mise à jour a échoué." })
      return
    }
    onChanged(image)
    onUpdated()
    setFeedback({ ok: true, message: "Photo de profil mise à jour." })
  }

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (preview === profile.image && preview === null) return
    const imageToSave = preview && preview.startsWith("data:") ? preview : null
    save(imageToSave)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageUp className="size-5 text-primary" aria-hidden />
          Photo de profil
        </CardTitle>
        <CardDescription>
          Une image carrée (PNG ou JPG, 2 Mo maximum). Elle est stockée directement dans votre
          profil, aucun service externe n&apos;est utilisé.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16">
            <AvatarImage src={preview ?? undefined} alt="Aperçu" />
            <AvatarFallback className="bg-primary/10 text-lg font-semibold text-primary">
              {profile.name?.charAt(0).toUpperCase() ?? "U"}
            </AvatarFallback>
          </Avatar>
          <div className="space-y-1.5">
            <Label htmlFor="avatar">Choisir une photo</Label>
            <Input
              id="avatar"
              type="file"
              accept="image/*"
              onChange={(event) => pickFile(event.target.files?.[0])}
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement…" : "Enregistrer la photo"}
            </Button>
            {profile.image && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => save(null)}
                disabled={loading}
                className="gap-2 text-destructive"
              >
                <Trash2 className="size-4" aria-hidden />
                Supprimer
              </Button>
            )}
          </div>
          {feedback && (
            <p
              role={feedback.ok ? "status" : "alert"}
              className={cn("w-full text-sm", feedback.ok ? "text-emerald-600" : "text-destructive")}
            >
              {feedback.message}
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

function FormulaireInformations({
  profile,
  onUpdated,
}: {
  profile: ProfileData
  onUpdated: () => void
}) {
  const [name, setName] = useState(profile.name)
  const [phoneNumber, setPhoneNumber] = useState(profile.phoneNumber ?? "")
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    if (!name.trim()) {
      setFeedback({ ok: false, message: "Le nom ne peut pas être vide." })
      return
    }

    setLoading(true)
    const { error } = await authClient.updateUser({
      name: name.trim(),
      phoneNumber: phoneNumber.trim() || null,
    } as Parameters<typeof authClient.updateUser>[0])

    if (error) {
      setFeedback({
        ok: false,
        message: error.message || "La mise à jour a échoué.",
      })
    } else {
      setFeedback({ ok: true, message: "Profil mis à jour." })
      onUpdated()
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserRound className="size-5 text-primary" aria-hidden />
          Informations personnelles
        </CardTitle>
        <CardDescription>
          Votre nom et votre numéro de téléphone. L&apos;adresse email ne peut pas être
          modifiée ici.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nom complet</Label>
            <Input
              id="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Ex : Jean Dupont"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="phoneNumber">Téléphone</Label>
            <Input
              id="phoneNumber"
              value={phoneNumber}
              onChange={(event) => setPhoneNumber(event.target.value)}
              placeholder="Ex : +237 6 99 00 00 00"
            />
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="email">Adresse email</Label>
            <Input id="email" value={profile.email} disabled />
            <p className="text-xs text-muted-foreground">
              Pour changer d&apos;email, écrivez à petchouko@gmail.com.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement…" : "Enregistrer les modifications"}
            </Button>
            {feedback && (
              <p
                role={feedback.ok ? "status" : "alert"}
                className={
                  feedback.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"
                }
              >
                {feedback.message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}

function FormulaireMotDePasse() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [visible, setVisible] = useState(false)
  const [feedback, setFeedback] = useState<Feedback>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setFeedback(null)

    if (newPassword.length < 8) {
      setFeedback({
        ok: false,
        message: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setFeedback({ ok: false, message: "Les deux mots de passe ne correspondent pas." })
      return
    }

    setLoading(true)
    const { error } = await authClient.changePassword({
      currentPassword,
      newPassword,
    })

    if (error) {
      setFeedback({
        ok: false,
        message:
          error.message ||
          "Le changement a échoué. Si votre compte utilise Google sans mot de passe, utilisez « Mot de passe oublié » pour en définir un.",
      })
    } else {
      setFeedback({ ok: true, message: "Mot de passe modifié." })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    }
    setLoading(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <KeyRound className="size-5 text-primary" aria-hidden />
          Sécurité du compte
        </CardTitle>
        <CardDescription>
          Changez votre mot de passe. Si vous vous connectez uniquement avec Google,
          utilisez « Mot de passe oublié » pour en définir un.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="currentPassword">Mot de passe actuel</Label>
            <div className="relative">
              <Input
                id="currentPassword"
                type={visible ? "text" : "password"}
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                autoComplete="current-password"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute top-0 right-0 h-full px-3"
                onClick={() => setVisible(!visible)}
                aria-label={visible ? "Masquer les mots de passe" : "Afficher les mots de passe"}
              >
                {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="newPassword">Nouveau mot de passe</Label>
            <Input
              id="newPassword"
              type={visible ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
            <Input
              id="confirmPassword"
              type={visible ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
            <Button type="submit" disabled={loading} className="gap-2">
              <ShieldCheck className="size-4" aria-hidden />
              {loading ? "Modification…" : "Modifier le mot de passe"}
            </Button>
            {feedback && (
              <p
                role={feedback.ok ? "status" : "alert"}
                className={
                  feedback.ok ? "text-sm text-emerald-600" : "text-sm text-destructive"
                }
              >
                {feedback.message}
              </p>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}