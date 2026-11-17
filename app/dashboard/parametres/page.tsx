"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { Bell, Shield, Palette, Trash2, Save, AlertCircle, CheckCircle2, Moon, Sun, Key } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { authClient } from "@/lib/auth-client";
import { useSafeSession } from "@/lib/auth-session";
import { useTheme } from "@/app/_components/theme-provider";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Spinner, PageLoading, ButtonSpinner } from "@/app/_components/spinner";

export default function ParametresPage() {
  const { data: session } = useSafeSession()
  const user = session?.user;
  const { theme, setTheme } = useTheme();

  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reservation: true,
    availability: true,
    system: true,
  });

  const [saving, setSaving] = useState<"profile" | "notifications" | "appearance" | "security" | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const handleSave = async (section: "profile" | "notifications" | "appearance" | "security") => {
    setSaving(section);
    setMessage(null);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setMessage({ type: "success", text: `${section === "profile" ? "Profil" : section === "notifications" ? "Notifications" : section === "appearance" ? "Apparence" : "Sécurité"} mis à jour` });
    } catch {
      setMessage({ type: "error", text: "Une erreur est survenue" });
    } finally {
      setSaving(null);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) return;
    if (!confirm("Cette action supprimera définitivement toutes vos données. Confirmez-vous ?")) return;

    try {
      const res = await fetch("/api/user/account", { method: "DELETE" });
      if (!res.ok) throw new Error("Erreur lors de la suppression");
      await authClient.signOut();
      window.location.href = "/";
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (!user) {
    return (
      <PageLoading />
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">Gérez vos préférences et la sécurité de votre compte</p>
      </div>

      {/* Notifications */}
      <Card className="border border-border shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="size-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>
            Choisissez ce dont vous souhaitez être informé
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave("notifications"); }} className="space-y-4">
            <div className="space-y-4">
              {[
                { key: "reservation", label: "Réservations", description: "Confirmations, rappels et expirations" },
                { key: "availability", label: "Disponibilités", description: "Nouvelles bouteilles près de chez vous" },
                { key: "system", label: "Système", description: "Mises à jour et maintenance" },
              ].map((item) => (
                <div key={item.key} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={notifications[item.key as keyof typeof notifications]}
                      onCheckedChange={(checked) => setNotifications((prev) => ({ ...prev, [item.key]: checked }))}
                      disabled={saving === "notifications"}
                    />
                    <div>
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {message && (
              <div className={cn(
                "rounded-md p-3 text-sm flex items-center gap-2",
                message.type === "success" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
              )} role="alert">
                {message.type === "success" ? <CheckCircle2 className="size-4 shrink-0" /> : <AlertCircle className="size-4 shrink-0" />}
                {message.text}
              </div>
            )}

            <Button type="submit" disabled={saving === "notifications"} className="w-full sm:w-auto">
              {saving === "notifications" ? (
                <>
                  <ButtonSpinner />
                  Enregistrement...
                </>
              ) : (
                <> <Save className="size-4 mr-2" /> Enregistrer les préférences </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="border border-border shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="size-5 text-primary" />
            Apparence
          </CardTitle>
          <CardDescription>
            Personnalisez l'affichage de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave("appearance"); }} className="space-y-6">
            <div>
              <h3 className="font-medium mb-3">Thème</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={theme === "light"}
                      onCheckedChange={(checked) => {
                        setTheme(checked ? "light" : "dark");
                        handleSave("appearance");
                      }}
                    />
                    <span className="font-medium">Mode clair</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={theme === "dark"}
                      onCheckedChange={(checked) => {
                        setTheme(checked ? "dark" : "light");
                        handleSave("appearance");
                      }}
                    />
                    <span className="font-medium">Mode sombre</span>
                  </label>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-3">Langue</h3>
              <Select value="fr" onValueChange={handleSave.bind(null, "appearance")} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Français" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fr">Français</SelectItem>
                  <SelectItem value="en" disabled>English (bientôt)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button type="submit" className="w-full sm:w-auto">
              <Save className="size-4 mr-2" /> Enregistrer
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Security */}
      <Card className="border border-border shadow-sm rounded-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="size-5 text-primary" />
            Sécurité
          </CardTitle>
          <CardDescription>
            Gérez votre mot de passe et la sécurité de votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave("security"); }} className="space-y-6">
            <div className="space-y-4">
              <h3 className="font-medium">Changer le mot de passe</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input id="currentPassword" type="password" placeholder="Votre mot de passe actuel" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input id="newPassword" type="password" placeholder="Au moins 8 caractères" minLength={8} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label htmlFor="confirmPassword">Confirmer le nouveau mot de passe</Label>
                  <Input id="confirmPassword" type="password" placeholder="Répétez le nouveau mot de passe" />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full sm:w-auto">
              <Key className="size-4 mr-2" /> Modifier le mot de passe
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border border-border shadow-sm rounded-lg border-destructive/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="size-5" />
            Zone de danger
          </CardTitle>
          <CardDescription>
            Actions irréversibles — à utiliser avec précaution
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 space-y-4">
            <AlertCircle className="size-4.5 shrink-0 mt-0.5 text-destructive" />
            <p className="font-medium text-destructive mb-1">
              Supprimer définitivement ton compte et toutes les données
            </p>
            <p className="text-sm text-muted-foreground">
              Cette action est irréversible et supprimera toutes tes données personnelles,
              historiques de réservations et préférences. Cette action ne peut pas être annulée.
            </p>
            <p className="text-xs text-muted-foreground">
              Cette action ne peut pas être annulée.
            </p>
            <Button variant="destructive" onClick={handleDeleteAccount} className="w-full sm:w-auto">
              <Trash2 className="size-4 mr-2" /> Supprimer mon compte
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}