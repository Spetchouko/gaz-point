"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  Lock,
  Save,
  AlertCircle,
  CheckCircle2,
  Settings,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Trash2,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useSafeSession } from "@/lib/auth-session";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { optimizeImageFile } from "@/lib/image-utils";
import { Spinner, PageLoading, ButtonSpinner } from "@/app/_components/spinner";

type UserProfile = {
  id: string;
  name: string;
  email: string;
  phoneNumber: string | null;
  image: string | null;
  role: string;
  lastLoginAt: string | null;
  createdAt: string | null;
  emailVerified: boolean;
};

type ProfilePageProps = {
  /** Title displayed in the header */
  title?: string;
  /** Optional back link for vendor/admin dashboards */
  backHref?: string;
  /** Role-specific subtitle */
  subtitle?: string;
};

/**
 * Composant de profil partagé pour les trois dashboards (Client, Vendeur, Admin).
 * Gère : informations personnelles, avatar, mot de passe, infos compte.
 */
export function ProfilePage({
  title = "Mon profil",
  backHref,
  subtitle = "Gérez vos informations personnelles et votre sécurité",
}: ProfilePageProps) {
  const router = useRouter();
  const { data: session } = useSafeSession();
  const sessionUser = session?.user;

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Informations personnelles
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // Mot de passe
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // États
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Avatar
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);

  // Erreurs de validation par champ
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const getUserInitials = () => {
    return profile?.name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U";
  };

  // Récupérer le profil complet (incluant lastLoginAt) depuis l'API
  useEffect(() => {
    let cancelled = false;
    async function loadProfile() {
      try {
        setLoadingProfile(true);
        const res = await fetch("/api/user/me", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Impossible de charger le profil");
        const data = await res.json();
        if (!cancelled && data.user) {
          const u = data.user;
          const nameParts = u.name.split(" ");
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(" ") || "");
          setEmail(u.email);
          setPhone(u.phoneNumber ?? "");
          setProfile(u);
        }
      } catch {
        // Erreur silencieuse, le profil affichera les valeurs de la session
        if (!cancelled && sessionUser) {
          const nameParts = (sessionUser.name || "").split(" ");
          setFirstName(nameParts[0] || "");
          setLastName(nameParts.slice(1).join(" ") || "");
          setEmail(sessionUser.email || "");
          setPhone(sessionUser.phoneNumber ?? null ?? "");
          setProfile({
            id: sessionUser.id,
            name: sessionUser.name || "",
            email: sessionUser.email || "",
            phoneNumber: sessionUser.phoneNumber ?? null,
            image: sessionUser.image ?? null,
            role: sessionUser.role || "client",
            lastLoginAt: null,
            createdAt: sessionUser.createdAt ?? null,
            emailVerified: sessionUser.emailVerified ?? false,
          });
        }
      } finally {
        if (!cancelled) setLoadingProfile(false);
      }
    }
    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [sessionUser]);

  // ---------- Mise à jour des informations personnelles ----------
  const validateProfile = (): boolean => {
    let valid = true;
    setFirstNameError(null);
    setLastNameError(null);
    setPhoneError(null);

    if (!firstName.trim()) {
      setFirstNameError("Le prénom est requis");
      valid = false;
    }
    if (!lastName.trim()) {
      setLastNameError("Le nom est requis");
      valid = false;
    }
    if (phone.trim() && !/^\+?[0-9\s-]{8,}$/.test(phone.trim())) {
      setPhoneError("Format de téléphone invalide");
      valid = false;
    }

    return valid;
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setProfileMessage(null);

    if (!validateProfile()) {
      setSaving(false);
      setProfileMessage({
        type: "error",
        text: "Impossible de mettre à jour vos informations. Vérifiez les champs renseignés.",
      });
      return;
    }

    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`;

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fullName,
          phone: phone.trim() || null,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour");

      setProfile((prev) => (prev ? { ...prev, name: fullName } : prev));
      setProfileMessage({
        type: "success",
        text: "Vos informations ont été mises à jour avec succès.",
      });
      toast.success("Profil mis à jour");
    } catch (error) {
      setProfileMessage({
        type: "error",
        text: "Impossible de mettre à jour vos informations. Vérifiez votre connexion et réessayez.",
      });
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  // ---------- Téléversement de l'avatar ----------
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setProfileMessage({
        type: "error",
        text: "Ce fichier n'est pas une image reconnue.",
      });
      return;
    }

    setAvatarUploading(true);
    setProfileMessage(null);

    try {
      const result = await optimizeImageFile(file);
      if (!result.ok) {
        setProfileMessage({ type: "error", text: result.error });
        return;
      }

      setAvatarPreview(result.dataUrl);
      setAvatarFile(file);

      // Envoyer au serveur
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: result.dataUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur lors du téléversement");

      setProfile((prev) => (prev ? { ...prev, image: result.dataUrl } : prev));
      setProfileMessage({
        type: "success",
        text: "Photo de profil mise à jour.",
      });
      toast.success("Avatar mis à jour");
    } catch {
      setProfileMessage({
        type: "error",
        text: "Échec du téléversement de la photo. Réessayez.",
      });
    } finally {
      setAvatarUploading(false);
      e.target.value = "";
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true);
    setProfileMessage(null);

    try {
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ remove: true }),
      });

      if (!res.ok) throw new Error("Erreur lors de la suppression");

      setAvatarPreview(null);
      setAvatarFile(null);
      setProfile((prev) => (prev ? { ...prev, image: null } : prev));
      setProfileMessage({ type: "success", text: "Photo de profil supprimée." });
      toast.success("Avatar supprimé");
    } catch {
      setProfileMessage({
        type: "error",
        text: "Échec de la suppression de la photo. Réessayez.",
      });
    } finally {
      setAvatarUploading(false);
    }
  };

  // ---------- Changement de mot de passe ----------
  const validatePassword = (): boolean => {
    if (!currentPassword) {
      setPasswordMessage({
        type: "error",
        text: "Veuillez saisir votre mot de passe actuel.",
      });
      return false;
    }
    if (!newPassword) {
      setPasswordMessage({
        type: "error",
        text: "Veuillez saisir un nouveau mot de passe.",
      });
      return false;
    }
    if (newPassword.length < 8) {
      setPasswordMessage({
        type: "error",
        text: "Le nouveau mot de passe doit contenir au moins 8 caractères.",
      });
      return false;
    }
    // Optionnel : vérification complexité (majuscule, minuscule, chiffre, spécial)
    const hasUpper = /[A-Z]/.test(newPassword);
    const hasLower = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(newPassword);
    if (!(hasUpper && hasLower && hasNumber && hasSpecial)) {
      setPasswordMessage({
        type: "error",
        text: "Le mot de passe doit contenir une majuscule, une minuscule, un chiffre et un caractère spécial.",
      });
      return false;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: "error",
        text: "Les deux mots de passe ne correspondent pas.",
      });
      return false;
    }
    return true;
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setPasswordMessage(null);

    if (!validatePassword()) {
      setChangingPassword(false);
      return;
    }

    try {
      const res = await fetch("/api/user/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur lors du changement de mot de passe");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordMessage({
        type: "success",
        text: "Mot de passe changé avec succès !",
      });
      toast.success("Mot de passe changé");
    } catch (error) {
      const msg =
        error instanceof Error
          ? error.message
          : "Échec du changement de mot de passe. Vérifiez votre mot de passe actuel.";
      setPasswordMessage({
        type: "error",
        text: msg.includes("mot de passe actuel") || msg.includes("incorrect")
          ? msg
          : "Échec du changement. Vérifiez votre mot de passe actuel et réessayez.",
      });
      toast.error("Erreur lors du changement");
    } finally {
      setChangingPassword(false);
    }
  };

  const formatLastLogin = (isoString: string | null): string => {
    if (!isoString) return "Première connexion";
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
      }).format(new Date(isoString));
    } catch {
      return isoString;
    }
  };

  if (loadingProfile || !sessionUser) {
    return <PageLoading />;
  }

  const userProfile = profile || {
    id: sessionUser.id,
    name: sessionUser.name || "",
    email: sessionUser.email || "",
    phoneNumber: sessionUser.phoneNumber ?? null,
    image: sessionUser.image ?? null,
    role: sessionUser.role || "client",
    lastLoginAt: null,
    createdAt: sessionUser.createdAt ?? null,
    emailVerified: sessionUser.emailVerified ?? false,
  };

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
            <p className="text-muted-foreground">{subtitle}</p>
          </div>
          {backHref && (
            <Link href={backHref}>
              <Button variant="outline" size="sm">
                <svg className="size-4 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Retour
              </Button>
            </Link>
          )}
        </div>

        {/* Personal Info Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="size-5 text-primary" />
              Informations personnelles
            </CardTitle>
            <CardDescription>Vos informations visibles sur votre compte GazPoints.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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
                    className={cn("border-input", firstNameError && "border-destructive")}
                    aria-invalid={!!firstNameError}
                    aria-describedby={firstNameError ? "firstName-error" : undefined}
                  />
                  {firstNameError && (
                    <p id="firstName-error" className="text-xs text-destructive" role="alert">
                      {firstNameError}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    disabled={saving}
                    placeholder="Votre nom"
                    className={cn("border-input", lastNameError && "border-destructive")}
                    aria-invalid={!!lastNameError}
                    aria-describedby={lastNameError ? "lastName-error" : undefined}
                  />
                  {lastNameError && (
                    <p id="lastName-error" className="text-xs text-destructive" role="alert">
                      {lastNameError}
                    </p>
                  )}
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="email">Adresse e-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted cursor-not-allowed"
                    aria-describedby="email-hint"
                  />
                  <p id="email-hint" className="text-xs text-muted-foreground">
                    L'adresse e-mail ne peut pas être modifiée depuis ici. Pour la changer,
                    contactez le support.
                  </p>
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
                      className={cn("pl-0 rounded-r-lg", phoneError && "border-destructive")}
                      aria-invalid={!!phoneError}
                      aria-describedby={phoneError ? "phone-error" : "phone-hint"}
                    />
                  </div>
                  {phoneError && (
                    <p id="phone-error" className="text-xs text-destructive" role="alert">
                      {phoneError}
                    </p>
                  )}
                  <p id="phone-hint" className="text-xs text-muted-foreground">
                    Format camerounais : 9 chiffres (ex: 6 99 00 00 00)
                  </p>
                </div>

                {/* Avatar upload */}
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="avatar">Photo de profil</Label>
                  <div className="flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex size-20 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary overflow-hidden border border-primary/20">
                        {(avatarPreview || userProfile.image) ? (
                          <Image
                            src={avatarPreview || userProfile.image!}
                            alt="Photo de profil"
                            width={80}
                            height={80}
                            className="size-20 object-cover"
                          />
                        ) : (
                          <span className="text-xl font-semibold">{getUserInitials()}</span>
                        )}
                        {(avatarUploading || saving) && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                            <Spinner size="sm" />
                          </div>
                        )}
                      </div>
                      <div className="space-y-2 text-center">
                        <p className="text-xs text-muted-foreground">Photo de profil</p>
                        <label
                          htmlFor="avatar"
                          className={cn(
                            "cursor-pointer text-sm font-medium underline underline-offset-4 hover:text-primary transition-colors",
                            (avatarUploading || saving) && "opacity-50 pointer-events-none"
                          )}
                        >
                          {avatarPreview || userProfile.image ? "Changer" : "Ajouter"} une photo
                        </label>
                      </div>
                    </div>
                    <input
                      id="avatar"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={handleAvatarChange}
                      disabled={avatarUploading || saving}
                      className="hidden"
                    />
                    {(avatarPreview || userProfile.image) && (
                      <button
                        type="button"
                        onClick={handleRemoveAvatar}
                        disabled={avatarUploading || saving}
                        className="flex items-center gap-1.5 text-xs text-destructive underline underline-offset-4 hover:text-destructive disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        Supprimer la photo
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {profileMessage && (
                <div
                  className={cn(
                    "rounded-md p-3 text-sm flex items-center gap-2",
                    profileMessage.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  )}
                  role="alert"
                >
                  {profileMessage.type === "success" ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0" />
                  )}
                  {profileMessage.text}
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full sm:w-auto h-11">
                {saving ? (
                  <>
                    <ButtonSpinner />
                    Enregistrement…
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Password Change Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Lock className="size-5 text-primary" />
              Changer le mot de passe
            </CardTitle>
            <CardDescription>
              Votre mot de passe doit contenir au moins 8 caractères, une majuscule, une minuscule,
              un chiffre et un caractère spécial.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
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
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showCurrentPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showCurrentPassword}
                  >
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
                    placeholder="Au moins 8 caractères, majuscule, minuscule, chiffre, spécial"
                    disabled={changingPassword}
                    minLength={8}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showNewPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showNewPassword}
                  >
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
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label={showConfirmPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                    aria-pressed={showConfirmPassword}
                  >
                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>

              {passwordMessage && (
                <div
                  className={cn(
                    "rounded-md p-3 text-sm flex items-center gap-2",
                    passwordMessage.type === "success"
                      ? "bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                      : "bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400"
                  )}
                  role="alert"
                >
                  {passwordMessage.type === "success" ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0" />
                  )}
                  {passwordMessage.text}
                </div>
              )}

              <Button type="submit" disabled={changingPassword} className="w-full sm:w-auto h-11">
                {changingPassword ? (
                  <>
                    <ButtonSpinner />
                    Modification…
                  </>
                ) : (
                  <>
                    <Lock className="size-4 mr-2" />
                    Changer le mot de passe
                  </>
                )}
              </Button>

              <div className="text-center pt-2">
                <Link
                  href="/mot-de-passe-demander"
                  className="text-sm text-primary hover:underline font-medium"
                >
                  Mot de passe oublié ?
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Account Info Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Settings className="size-5 text-primary" />
              Informations du compte
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm text-muted-foreground">Rôle</dt>
                <dd className="font-medium capitalize flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Shield className="size-3.5" />
                  </span>
                  {userProfile.role || "client"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">E-mail vérifié</dt>
                <dd className="font-medium flex items-center gap-2">
                  <span className="flex size-7 items-center justify-center rounded-full bg-green/10 text-green">
                    <CheckCircle2 className="size-3.5" />
                  </span>
                  {userProfile.emailVerified ? "Oui" : "Non"}
                </dd>
              </div>
              <div>
                <dt className="text-sm text-muted-foreground">Compte créé le</dt>
                <dd className="font-medium">
                  {userProfile.createdAt
                    ? new Intl.DateTimeFormat("fr-FR", {
                        timeZone: "Africa/Douala",
                        day: "2-digit",
                        month: "2-digit",
                        year: "numeric",
                      }).format(new Date(userProfile.createdAt))
                    : "—"}
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
    </div>
  );
}