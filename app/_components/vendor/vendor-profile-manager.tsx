"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import {
  Camera,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Save,
  Trash2,
  User,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  VendorErrorState,
  VendorNotice,
  VendorPageHeader,
  VendorSectionCard,
} from "@/app/_components/vendor/vendor-ui"
import { formatDateTime } from "@/lib/gaz"
import { optimizeImageFile } from "@/lib/image-utils"
import type { VendorProfileDto } from "@/lib/vendor-dashboard"

type ActionError = { message: string; retry: () => void }

function initials(name: string | null): string {
  return (
    name
      ?.trim()
      .split(/\s+/)
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "GP"
  )
}

export function VendorProfileManager({
  profile,
}: {
  profile: VendorProfileDto
}) {
  const router = useRouter()
  const profileFormRef = useRef<HTMLFormElement | null>(null)
  const passwordFormRef = useRef<HTMLFormElement | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [name, setName] = useState(profile.name ?? "")
  const [phone, setPhone] = useState(profile.phoneNumber ?? "")
  const [image, setImage] = useState<string | null>(profile.image)
  const [savingProfile, setSavingProfile] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState<ActionError | null>(null)

  const readError = async (response: Response, fallback: string) => {
    const payload = (await response.json().catch(() => null)) as {
      error?: string
    } | null
    if (!response.ok) throw new Error(payload?.error ?? fallback)
  }

  const handleProfileSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (name.trim().length < 2) {
      setError({
        message: "Le nom doit contenir au moins 2 caractères.",
        retry: () => profileFormRef.current?.requestSubmit(),
      })
      return
    }
    if (phone.trim() && !/^\+?[0-9\s-]{8,}$/.test(phone.trim())) {
      setError({
        message: "Le format du numéro de téléphone est invalide.",
        retry: () => profileFormRef.current?.requestSubmit(),
      })
      return
    }

    const retry = () => profileFormRef.current?.requestSubmit()
    void (async () => {
      setSavingProfile(true)
      try {
        const response = await fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            phone: phone.trim() || null,
          }),
        })
        await readError(response, "Impossible de mettre à jour le profil")
        toast.success("Profil mis à jour")
        router.refresh()
      } catch (saveError) {
        setError({
          message:
            saveError instanceof Error
              ? saveError.message
              : "Impossible de mettre à jour le profil.",
          retry,
        })
      } finally {
        setSavingProfile(false)
      }
    })()
  }

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file) return

    void (async () => {
      setUploadingAvatar(true)
      setError(null)
      try {
        const optimized = await optimizeImageFile(file)
        if (!optimized.ok) throw new Error(optimized.error)

        const response = await fetch("/api/user/avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: optimized.dataUrl }),
        })
        await readError(response, "Impossible de mettre à jour la photo")
        setImage(optimized.dataUrl)
        toast.success("Photo de profil mise à jour")
        router.refresh()
      } catch (uploadError) {
        setError({
          message:
            uploadError instanceof Error
              ? uploadError.message
              : "Impossible de mettre à jour la photo de profil.",
          retry: () => fileInputRef.current?.click(),
        })
      } finally {
        setUploadingAvatar(false)
      }
    })()
  }

  const handleAvatarRemove = () => {
    void (async () => {
      setUploadingAvatar(true)
      setError(null)
      try {
        const response = await fetch("/api/user/avatar", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ remove: true }),
        })
        await readError(response, "Impossible de supprimer la photo")
        setImage(null)
        toast.success("Photo de profil supprimée")
        router.refresh()
      } catch (removeError) {
        setError({
          message:
            removeError instanceof Error
              ? removeError.message
              : "Impossible de supprimer la photo de profil.",
          retry: handleAvatarRemove,
        })
      } finally {
        setUploadingAvatar(false)
      }
    })()
  }

  const handlePasswordSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    if (!currentPassword || newPassword.length < 8) {
      setError({
        message:
          "Le mot de passe actuel est requis et le nouveau doit contenir au moins 8 caractères.",
        retry: () => passwordFormRef.current?.requestSubmit(),
      })
      return
    }
    if (newPassword !== confirmPassword) {
      setError({
        message: "Les deux nouveaux mots de passe ne correspondent pas.",
        retry: () => passwordFormRef.current?.requestSubmit(),
      })
      return
    }

    const retry = () => passwordFormRef.current?.requestSubmit()
    void (async () => {
      setSavingPassword(true)
      try {
        const response = await fetch("/api/user/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        })
        await readError(response, "Impossible de changer le mot de passe")
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        toast.success("Mot de passe changé avec succès")
        router.refresh()
      } catch (passwordError) {
        setError({
          message:
            passwordError instanceof Error
              ? passwordError.message
              : "Impossible de changer le mot de passe.",
          retry,
        })
      } finally {
        setSavingPassword(false)
      }
    })()
  }

  return (
    <div className="space-y-4">
      <VendorPageHeader
        title="Mon profil"
        description="Gérez vos informations personnelles et la sécurité du compte."
      />

      {error && (
        <VendorErrorState message={error.message} onRetry={error.retry} />
      )}

      <div className="grid gap-4 lg:grid-cols-[300px_1fr] lg:items-start">
        <div className="space-y-4">
          <VendorSectionCard title="Identité" description="Votre compte GazPoints">
            <div className="flex items-center gap-3">
              <span className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-primary/20 bg-primary/10 text-sm font-semibold text-primary">
                {image ? (
                  <Image
                    src={image}
                    alt="Photo de profil"
                    width={56}
                    height={56}
                    className="size-14 object-cover"
                    unoptimized
                  />
                ) : (
                  initials(name || profile.email)
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">
                  {name || "Vendeur GazPoints"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {profile.email ?? "—"}
                </p>
                <p className="mt-1 text-xs capitalize text-muted-foreground">
                  Rôle : {profile.role ?? "vendor"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarChange}
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploadingAvatar}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="size-3.5" aria-hidden />
                {uploadingAvatar ? "Traitement…" : "Changer la photo"}
              </Button>
              {image && (
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={uploadingAvatar}
                  onClick={handleAvatarRemove}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Supprimer
                </Button>
              )}
            </div>
          </VendorSectionCard>

          <VendorSectionCard title="Informations du compte" contentClassName="p-0">
            <dl className="divide-y divide-border/70 text-sm">
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="size-3.5" aria-hidden />
                  E-mail
                </dt>
                <dd className="truncate text-right text-foreground">
                  {profile.email ?? "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle2 className="size-3.5" aria-hidden />
                  E-mail vérifié
                </dt>
                <dd className="text-right text-foreground">
                  {profile.emailVerified ? "Oui" : "Non"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <dt className="text-muted-foreground">Compte créé</dt>
                <dd className="text-right text-foreground">
                  {profile.createdAt ? formatDateTime(profile.createdAt) : "—"}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                <dt className="text-muted-foreground">Dernière connexion</dt>
                <dd className="text-right text-foreground">
                  {profile.lastLoginAt
                    ? formatDateTime(profile.lastLoginAt)
                    : "Première connexion"}
                </dd>
              </div>
            </dl>
          </VendorSectionCard>
        </div>

        <div className="space-y-4">
          <VendorSectionCard
            title="Informations personnelles"
            description="Ces informations sont utilisées pour votre compte."
          >
            <form
              ref={profileFormRef}
              onSubmit={handleProfileSubmit}
              className="space-y-3"
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-profile-name">Nom complet</Label>
                  <Input
                    id="vendor-profile-name"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    maxLength={100}
                    disabled={savingProfile}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vendor-profile-phone">Téléphone</Label>
                  <Input
                    id="vendor-profile-phone"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+237 6 00 00 00 00"
                    maxLength={30}
                    disabled={savingProfile}
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="vendor-profile-email">Adresse e-mail</Label>
                <Input
                  id="vendor-profile-email"
                  type="email"
                  value={profile.email ?? ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  L’adresse e-mail ne peut pas être modifiée depuis cet espace.
                </p>
              </div>
              <div className="flex justify-end border-t border-border pt-3">
                <Button type="submit" size="sm" disabled={savingProfile}>
                  <Save className="size-3.5" aria-hidden />
                  {savingProfile ? "Enregistrement…" : "Enregistrer"}
                </Button>
              </div>
            </form>
          </VendorSectionCard>

          <VendorSectionCard
            title="Sécurité"
            description="Changez votre mot de passe pour protéger votre compte."
          >
            <VendorNotice>
              Le changement de mot de passe déconnecte vos autres sessions.
            </VendorNotice>
            <form
              ref={passwordFormRef}
              onSubmit={handlePasswordSubmit}
              className="mt-3 space-y-3"
            >
              <PasswordField
                id="vendor-current-password"
                label="Mot de passe actuel"
                value={currentPassword}
                onChange={setCurrentPassword}
                visible={showCurrent}
                onToggleVisibility={() => setShowCurrent((value) => !value)}
                disabled={savingPassword}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <PasswordField
                  id="vendor-new-password"
                  label="Nouveau mot de passe"
                  value={newPassword}
                  onChange={setNewPassword}
                  visible={showNew}
                  onToggleVisibility={() => setShowNew((value) => !value)}
                  disabled={savingPassword}
                  hint="8 caractères minimum"
                />
                <PasswordField
                  id="vendor-confirm-password"
                  label="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={setConfirmPassword}
                  visible={showConfirm}
                  onToggleVisibility={() => setShowConfirm((value) => !value)}
                  disabled={savingPassword}
                />
              </div>
              <div className="flex justify-end border-t border-border pt-3">
                <Button type="submit" size="sm" disabled={savingPassword}>
                  <Lock className="size-3.5" aria-hidden />
                  {savingPassword ? "Modification…" : "Changer le mot de passe"}
                </Button>
              </div>
            </form>
          </VendorSectionCard>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <User className="size-3.5" aria-hidden />
        Les informations du compte sont lues côté serveur et filtrées sur votre
        session.
      </div>
    </div>
  )
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  visible,
  onToggleVisibility,
  disabled,
  hint,
}: {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  visible: boolean
  onToggleVisibility: () => void
  disabled: boolean
  hint?: string
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="pr-9"
          autoComplete="new-password"
        />
        <button
          type="button"
          onClick={onToggleVisibility}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden />
          ) : (
            <Eye className="size-4" aria-hidden />
          )}
        </button>
      </div>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  )
}
