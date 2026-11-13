"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { User, Mail, Phone, Lock, Save, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ProfilPage() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const user = session?.user;

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState("");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [avatarUrl, setAvatarUrl] = useState(user?.image || null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const getUserInitials = () => {
    return user?.name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "U";
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setMessage({ type: "error", text: "Veuillez sélectionner une image valide." });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ type: "error", text: "L'image ne doit pas dépasser 5 Mo." });
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const formData = new FormData();
      if (name) formData.append("name", name);
      if (phone) formData.append("phone", phone);
      if (avatarFile) formData.append("avatar", avatarFile);

      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Erreur lors de la mise à jour");

      if (avatarFile) {
        setAvatarUrl(avatarPreview);
      }

      setMessage({ type: "success", text: "Profil mis à jour avec succès" });
      toast.success("Profil mis à jour");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Une erreur est survenue" });
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setChangingPassword(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ type: "error", text: "Les mots de passe ne correspondent pas" });
      setChangingPassword(false);
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: "error", text: "Le mot de passe doit contenir au moins 8 caractères" });
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
      setMessage({ type: "success", text: "Mot de passe modifié avec succès" });
      toast.success("Mot de passe modifié");
    } catch (error) {
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Une erreur est survenue" });
      toast.error("Erreur lors du changement");
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Mon profil</h1>
        <p className="text-muted-foreground">Gérez vos informations personnelles et votre sécurité</p>
      </div>

      {/* Profile info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="size-5 text-primary" />
            Informations personnelles
          </CardTitle>
          <CardDescription>
            Vos informations visibles sur votre compte GazPoints
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">Nom complet</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saving}
                  placeholder="Votre nom complet"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  disabled
                  className="bg-muted cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié depuis ici.</p>
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
                    className="pl-0 rounded-r-lg"
                  />
                </div>
              </div>

              {/* Avatar upload */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="avatar">Photo de profil</Label>
                <div className="flex flex-col items-center gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary shrink-0 overflow-hidden border border-primary/20">
                      {avatarUrl ? (
                        <Image
                          src={avatarUrl}
                          alt="Photo de profil"
                          width={64}
                          height={64}
                          className="size-16 object-cover"
                        />
                      ) : (
                        <span className="text-sm font-semibold">{getUserInitials()}</span>
                      )}
                    </div>
                    <div className="space-y-2 text-center">
                      <p className="text-xs text-muted-foreground">Photo de profil</p>
                      <label
                        className="cursor-pointer text-sm text-primary underline underline-offset-4 hover:text-primary-dark"
                      >
                        {avatarFile ? "Changer l'image" : "Choisir une image"}
                      </label>
                    </div>
                  </div>
                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  {avatarPreview && (
                    <button
                      type="button"
                      onClick={() => {
                        setAvatarFile(null);
                        setAvatarPreview(null);
                        setAvatarUrl(user?.image || null);
                      }}
                      className="text-xs text-destructive underline underline-offset-4 hover:text-destructive"
                    >
                      Supprimer la photo
                    </button>
                  )}
                </div>
              </div>

              {message && (
                <div className={cn(
                  "rounded-md p-3 text-sm flex items-center gap-2",
                  message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                )} role="alert">
                  {message.type === "success" ? (
                    <CheckCircle2 className="size-4 shrink-0" />
                  ) : (
                    <AlertCircle className="size-4 shrink-0" />
                  )}
                  {message.text}
                </div>
              )}

              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="size-4 mr-2 animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <Save className="size-4 mr-2" />
                    Enregistrer les modifications
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Password change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-5 text-primary" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Votre mot de passe doit contenir au moins 8 caractères
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="currentPassword">Mot de passe actuel</Label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                disabled={changingPassword}
                placeholder="Votre mot de passe actuel"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">Nouveau mot de passe</Label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Au moins 8 caractères"
                disabled={changingPassword}
                minLength={8}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Répétez le nouveau mot de passe"
                disabled={changingPassword}
              />
            </div>

            {message && (
              <div className={cn(
                "rounded-md p-3 text-sm flex items-center gap-2",
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )} role="alert">
                {message.type === "success" ? (
                  <CheckCircle2 className="size-4 shrink-0" />
                ) : (
                  <AlertCircle className="size-4 shrink-0" />
                )}
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={changingPassword} className="w-full sm:w-auto">
              {changingPassword ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Modification...
                </>
              ) : (
                <>
                  <Lock className="size-4 mr-2" />
                  Changer le mot de passe
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Account info */}
      <Card>
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
              <dd className="font-medium capitalize">
                {(user as any)?.role || "client"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Email vérifié</dt>
              <dd className="font-medium flex items-center gap-2">
                <span className="flex size-5 items-center justify-center rounded-full bg-green/10 text-green">
                  <CheckCircle2 className="size-3" />
                </span>
                Oui
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Compte créé le</dt>
              <dd className="font-medium">
                {(user as any)?.createdAt
                  ? new Date((user as any).createdAt).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })
                  : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Dernière connexion</dt>
              <dd className="font-medium">—</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}


