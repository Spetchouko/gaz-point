"use client"

export const dynamic = "force-dynamic"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Settings,
  Eye,
  EyeOff,
  ArrowLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Spinner } from "@/app/_components/spinner"

type UserProfile = {
  id: string
  name: string
  email: string
  phoneNumber: string | null
  image: string | null
  role: string
  lastLoginAt: string | null
  createdAt: string | null
  emailVerified: boolean
}

export default function AdminProfilPage() {
  const router = useRouter()
  const { data: session } = authClient.useSession()
  const user = session?.user

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error"
    text: string
  } | null>(null)

  const [firstNameError, setFirstNameError] = useState<string | null>(null)
  const [lastNameError, setLastNameError] = useState<string | null>(null)
  const [phoneError, setPhoneError] = useState<string | null>(null)

  const getUserInitials = () => {
    return profile?.name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U"
  }

  useEffect(() => {
    let cancelled = false
    async function loadProfile() {
      try {
        setLoadingProfile(true)
        const res = await fetch("/api/user/me", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Impossible de charger le profil")
        const data = await res.json()
        if (!cancelled && data.user) {
          const u = data.user
          const nameParts = u.name.split(" ")
          setFirstName(nameParts[0] || "")
          setLastName(nameParts.slice(1).join(" ") || "")
          setEmail(u.email)
          setPhone(u.phoneNumber ?? "")
          setProfile(u)
        }
      } catch {
        if (!cancelled && session?.user) {
          const su = session.user as { name?: string | null; email?: string | null; phoneNumber?: string | null; role?: string | null; image?: string | null; emailVerified?: boolean; createdAt?: string | null }
          const nameParts = (su.name || "").split(" ")
          setFirstName(nameParts[0] || "")
          setLastName(nameParts.slice(1).join(" ") || "")
          setEmail(su.email || "")
          setPhone(su.phoneNumber ?? "")
          setProfile({
            id: su.id,
            name: su.name || "",
            email: su.email || "",
            phoneNumber: su.phoneNumber ?? null,
            image: su.image ?? null,
            role: su.role || "admin",
            lastLoginAt: null,
            createdAt: su.createdAt ?? null,
            emailVerified: su.emailVerified ?? false,
          })
        }
      } finally {
        if (!cancelled) setLoadingProfile(false)
      }
    }
    loadProfile()
    return () => {
      cancelled = true
    }
  }, [session?.user])

  const validateProfile = (): boolean => {
    let valid = true
    setFirstNameError(null)
    setLastNameError(null)
    setPhoneError(null)

    if (!firstName.trim()) {
      setFirstNameError("Le prénom est requis")
      valid = false
    }
    if (!lastName.trim()) {
      setLastNameError("Le nom est requis")
      valid = false
    }
    if (phone.trim() && !/^\+?[0-9\s-]{8,}$/.test(phone.trim())) {
      setPhoneError("Format de téléphone invalide")
      valid = false
    }

    return valid
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setProfileMessage(null)

    if (!validateProfile()) {
      setSaving(false)
      setProfileMessage({
        type: "error",
        text: "Impossible de mettre à jour vos informations. Vérifiez votre connexion et les champs renseignés, puis réessayez.",
      })
      return
    }

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phone: phone.trim() || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour")

      setProfile((prev) => (prev ? { ...prev, name: fullName } : prev))
      setProfileMessage({
        type: "success",
        text: "Vos informations ont été mises à jour avec succès.",
      })
      toast.success("Profil mis à jour")
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: "Impossible de mettre à jour vos informations. Vérifiez votre connexion et les champs renseignés, puis réessayez.",
      })
      toast.error("Erreur lors de la mise à jour")
    } finally {
      setSaving(false)
    }
  }

  const validatePassword = (): boolean => {
    if (!currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Échec du changement de mot de passe. Vérifiez votre mot de passe actuel et assurez-vous que le nouveau mot de passe respecte les conditions de sécurité, puis réessayez.",
      })
      return false
    }
    if (!newPassword) {
      setPasswordMessage({
        type: "error",
        text: "Échec du changement de mot de passe. Vérifiez votre mot de passe actuel et assurez-vous que le nouveau mot de passe respecte les conditions de sécurité, puis réessayez.",
      })
      return false
    }
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Échec du changement de mot de passe. Vérifiez votre mot de passe actuel et assurez-vous que le nouveau mot de passe respecte les conditions de sécurité, puis réessayez.",
      })
      return false
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Échec du changement de mot de passe. Vérifiez votre mot de passe actuel et assurez-vous que le nouveau mot de passe respecte les conditions de sécurité, puis réessayez.",
      })
      return false
    }
    return true
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setChangingPassword(true)
    setPasswordMessage(null)

    if (!validatePassword()) {
      setChangingPassword(false)
      return
    }

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || "Erreur lors du changement de mot de passe")

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setPasswordMessage({
        type: "success",
        text: "Mot de passe changé avec succès !",
      })
      toast.success("Mot de passe changé")
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Échec du changement de mot de passe. Vérifiez votre mot de passe actuel et assurez-vous que le nouveau mot de passe respecte les conditions de sécurité, puis réessayez."
      setPasswordMessage({
        type: "error",
        text: msg.includes("mot de passe actuel") || msg.includes("incorrect") ? msg : "Échec du changement de mot de passe. Vérifiez votre mot de passe actuel et assurez-vous que le nouveau mot de passe respecte les conditions de sécurité, puis réessayez.",
      })
      toast.error("Erreur lors du changement")
    } finally {
      setChangingPassword(false)
    }
  }

  const formatLastLogin = (isoString: string | null): string => {
    if (!isoString) return "Première connexion"
    try {
      return new Intl.DateTimeFormat("fr-FR", {
        timeZone: "Africa/Douala",
        day: "2-digit",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      }).format(new Date(isoString))
    } catch {
      return isoString
    }
  }

  if (loadingProfile || !session?.user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="size-8 animate-spin text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Chargement…</p>
        </div>
      </div>
    )
  }

  const userProfile = profile || {
    id: session.user.id,
    name: session.user.name || "",
    email: session.user.email || "",
    phoneNumber: session.user.phoneNumber ?? null,
    image: session.user.image ?? null,
    role: session.user.role || "admin",
    lastLoginAt: null,
    createdAt: session.user.createdAt ?? null,
    emailVerified: session.user.emailVerified ?? false,
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
          <p className="text-muted-foreground">Gérez vos informations personnelles et votre sécurité</p>
        </div>
        <Link href="/dashboard/admin">
          <Button variant="outline">
            <ArrowLeft className="size-4 mr-2" /> Retour
          </Button>
        </Link>
      </div>

      <Card className="border border-border shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            Informations personnelles
          </CardTitle>
          <CardDescription>Vos informations visibles sur votre compte GazPoints</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">Prénom</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  disabled={saving}
                  placeholder="Votre prénom"
                  className={cn("border-input", firstNameError ? "border-destructive" : "")}
                />
                {firstNameError && <p className="text-xs text-destructive">{firstNameError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Nom</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  disabled={saving}
                  placeholder="Votre nom"
                  className={cn("border-input", lastNameError ? "border-destructive" : "")}
                />
                {lastNameError && <p className="text-xs text-destructive">{lastNameError}</p>}
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">L'adresse e-mail ne peut pas être modifiée depuis ici.</p>
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="phone">Numéro de téléphone</Label>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 text-sm font-medium text-muted-foreground rounded-l border border-r-0 border-input bg-muted">
                    +237
                  </span>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                    placeholder="XX XX XX XX XX"
                    maxLength={9}
                    disabled={saving}
                    className={cn("pl-0 rounded-r-lg", phoneError ? "border-destructive" : "")}
                  />
                </div>
                {phoneError && <p className="text-xs text-destructive">{phoneError}</p>}
              </div>

              {profileMessage && (
                <div className={cn("rounded-md p-3 text-sm flex items-center gap-2", profileMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")} role="alert">
                  {profileMessage.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                  {profileMessage.text}
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" /> Enregistrement…
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" /> Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>Votre mot de passe doit contenir au moins 8 caractères</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={changingPassword}
                  placeholder="Votre mot de passe actuel"
                />
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showCurrentPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {showCurrentPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Au moins 8 caractères"
                  disabled={changingPassword}
                  minLength={8}
                />
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {showNewPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Répétez le nouveau mot de passe"
                  disabled={changingPassword}
                />
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}>
                  {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>

            {passwordMessage && (
              <div className={cn("rounded-md p-3 text-sm flex items-center gap-2", passwordMessage.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700")} role="alert">
                {passwordMessage.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                {passwordMessage.text}
              </div>
            )}

            <Button type="submit" disabled={changingPassword} className="w-full sm:w-auto">
              {changingPassword ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" /> Modification…
                </>
              ) : (
                <>
                  <Lock className="size-4 mr-2" /> Changer le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border border-border shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="size-5 text-primary" />
            Informations du compte
          </CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">Rôle</dt>
              <dd className="font-medium capitalize">{userProfile.role || "admin"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">E-mail vérifié</dt>
              <dd className="font-medium flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-green/10 text-green"><CheckCircle2 className="size-3" /></span>
                {userProfile.emailVerified ? "Oui" : "Non"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Compte créé le</dt>
              <dd className="font-medium">
                {userProfile.createdAt ? new Intl.DateTimeFormat("fr-FR", { timeZone: "Africa/Douala", day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(userProfile.createdAt)) : "—"}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm text-muted-foreground">Dernière connexion</dt>
              <dd className="font-medium">{formatLastLogin(userProfile.lastLoginAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  )
}
