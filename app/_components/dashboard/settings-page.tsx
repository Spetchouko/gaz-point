"use client";

import { useEffect, useState } from "react";
import { Bell, Palette, Save, CheckCircle2, AlertCircle, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useTheme } from "@/app/_components/theme-provider";

type Prefs = {
  notifyReservations: boolean;
  notifyAvailability: boolean;
  notifySystem: boolean;
  notifyMarketing: boolean;
  themePreference: "light" | "dark" | "system";
};

const defaults: Prefs = {
  notifyReservations: true,
  notifyAvailability: true,
  notifySystem: true,
  notifyMarketing: false,
  themePreference: "system",
};

const notificationOptions = [
  {
    key: "notifyReservations",
    label: "Réservations",
    description: "Confirmations, changements de statut et rappels liés à vos réservations.",
    icon: Bell,
  },
  {
    key: "notifyAvailability",
    label: "Disponibilités",
    description: "Alertes lorsque des disponibilités pertinentes évoluent.",
    icon: Bell,
  },
  {
    key: "notifySystem",
    label: "Système et compte",
    description: "Informations importantes concernant votre compte et la plateforme.",
    icon: Bell,
  },
  {
    key: "notifyMarketing",
    label: "Actualités et offres",
    description: "Promotions et communications marketing (optionnel).",
    icon: Bell,
  },
] as const;

export function DashboardSettingsPage({ title = "Paramètres" }: { title?: string }) {
  const [prefs, setPrefs] = useState<Prefs>(defaults);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { setTheme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/user/preferences", {
          headers: { Accept: "application/json" },
          cache: "no-store",
        });
        if (!res.ok) throw new Error("load failed");
        const data = await res.json();
        if (!cancelled && data.preferences) {
          const p = { ...defaults, ...data.preferences } as Prefs;
          setPrefs(p);
          if (p.themePreference) setTheme(p.themePreference);
        }
      } catch {
        if (!cancelled) toast.error("Impossible de charger vos préférences.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [setTheme]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "save failed");
      }
      const data = await res.json();
      if (data.preferences) setPrefs({ ...defaults, ...data.preferences });
      setTheme(prefs.themePreference);
      toast.success("Paramètres enregistrés.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="size-6 animate-spin text-primary" />
          <span>Chargement des paramètres…</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-200px)] items-start justify-center py-8 px-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground">Gérez vos préférences de notifications et d&apos;affichage.</p>
        </div>

        {/* Notifications Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Bell className="size-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Choisissez les types de notifications que vous souhaitez recevoir.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 pt-0">
            {notificationOptions.map(({ key, label, description }) => (
              <div
                key={key}
                className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 py-3 border-t border-border/50 first:border-0"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Bell className="size-5" aria-hidden />
                  </div>
                  <div className="min-w-0">
                    <Label htmlFor={`pref-${key}`} className="font-medium truncate">
                      {label}
                    </Label>
                    <p className="text-sm text-muted-foreground truncate">{description}</p>
                  </div>
                </div>
                <Switch
                  id={`pref-${key}`}
                  checked={prefs[key as keyof Prefs] as boolean}
                  onCheckedChange={(v) => setPrefs((p) => ({ ...p, [key]: v }))}
                  disabled={saving}
                  className="shrink-0"
                />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Display Card */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Palette className="size-5 text-primary" />
              Affichage
            </CardTitle>
            <CardDescription>Personnalisez l&apos;apparence de l&apos;interface.</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 max-w-sm">
              <Label htmlFor="theme-select" className="font-medium">
                Thème
              </Label>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={prefs.themePreference === "light"}
                      onCheckedChange={(checked) => setPrefs((p) => ({ ...p, themePreference: checked ? "light" : "dark" }))}
                    />
                    <span className="font-medium">Mode clair</span>
                  </label>
                </div>
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={prefs.themePreference === "dark"}
                      onCheckedChange={(checked) => setPrefs((p) => ({ ...p, themePreference: checked ? "dark" : "light" }))}
                    />
                    <span className="font-medium">Mode sombre</span>
                  </label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Le thème « Système » suit les préférences de votre appareil.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            onClick={save}
            disabled={saving}
            className="w-full sm:w-auto min-w-[200px] h-11"
            size="default"
          >
            {saving ? (
              <>
                <Loader2 className="size-4 mr-2 animate-spin" />
                Enregistrement…
              </>
            ) : (
              <>
                <Save className="size-4 mr-2" />
                Enregistrer les paramètres
              </>
            )}
          </Button>
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground w-full sm:w-auto justify-center">
            <CheckCircle2 className="size-4 shrink-0 text-success" />
            <span>Conservés après reconnexion</span>
          </div>
        </div>

        {/* Info Card */}
        {/* Danger Zone */}
        <Card className="border-destructive/50 shadow-sm">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Trash2 className="size-5" />
              Zone de danger
            </CardTitle>
            <CardDescription>
              Actions irréversibles — à utiliser avec précaution
            </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
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
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}