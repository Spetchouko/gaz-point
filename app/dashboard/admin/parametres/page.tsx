"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  LayoutDashboard,
  Settings,
  Shield,
  Mail,
  Phone,
  Calendar,
  Trash2,
  Edit2,
  Image,
  RefreshCW,
  Search,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { useToast } from "@/app/_components/dashboard/toast-provider"
import { cn } from "@/lib/utils"

export default function AdminParametresPage() {
  const [lang, setLang] = useState("fr")
  const [notifications, setNotifications] = useState(true)
  const [theme, setTheme] = useState("system")
  const [autoSave, setAutoSave] = useState(true)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { showToast } = useToast()

  const languages = [
    { value: "fr", label: "Français" },
    { value: "en", label: "English" },
    { value: "es", label: "Español" },
  ]

  const themes = [
    { value: "system", label: "Système" },
    { value: "light", label: "Clair" },
    { value: "dark", label: "Sombre" },
  ]

  useEffect(() => {
    // Appliquer les préférences utilisateur
    const applyPrefs = () => {
      const root = document.documentElement
      if (theme === "dark") {
        root.classList.add("dark")
      } else if (theme === "light") {
        root.classList.remove("dark")
      }
      // Langue non appliquée ici (irait dans un provider i18n)
    }

    applyPrefs()
  }, [theme])

  const handleLangChange = (value: string) => {
    setLang(value)
    showToast({
      title: "Langue mise à jour",
      description: `Langue passée à ${languages.find((l) => l.value === value)?.label || value}.`,
    })
  }

  const handleThemeChange = (value: string) => {
    setTheme(value)
    showToast({
      title: "Thème mis à jour",
      description: `Thème passé à ${themes.find((t) => t.value === value)?.label || value}.`,
    })
  }

  const handleNotificationToggle = () => {
    setNotifications((prev) => !prev)
    showToast({
      title: "Notifications",
      description: `Notifications ${!notifications ? "activées" : "désactivées"}.`,
    })
  }

  const handleAutoSaveToggle = () => {
    setAutoSave((prev) => !prev)
    showToast({
      title: "Préférence enregistrée",
      description: `Enregistrement automatique ${!autoSave ? "désactivé" : "activé"}.`,
    })
  }

  const handleConfirmDeleteToggle = () => setConfirmDelete(true)

  const handleDeleteAccount = async () => {
    if (!confirmDelete) return
    try {
      setIsLoading(true)
      const res = await fetch(`/api/admin/account`, {
        method: "DELETE",
        headers: { Accept: "application/json", "Content-Type": "application/json" },
        cache: "no-store",
      })
      if (!res.ok) throw new Error("Impossible de supprimer le compte")
      showToast({
        title: "Compte supprimé",
        description: "Votre compte administrateur a été supprimé.",
        variant: "destructive",
      })
      router.push("/")
      router.refresh()
    } catch (err) {
      showToast({
        title: "Erreur",
        description: err instanceof Error ? err.message : "Erreur inconnue",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Paramètres</h1>
        <p className="text-muted-foreground">
          Configurez les préférences de votre compte administrateur
        </p>
      </div>

      {/* Préférences générales */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle>Préférences générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Langue</p>
              <Select
                value={lang}
                onValueChange={(value) => handleLangChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                  <SelectContent>
                    {languages.map((langObj) => (
                      <SelectItem key={langObj.value} value={langObj.value}>
                        {langObj.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectTrigger>
              </Select>
            </div>

            <div>
              <p className="text-sm text-muted-foreground">Thème</p>
              <Select
                value={theme}
                onValueChange={(value) => handleThemeChange(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                  <SelectContent>
                    {themes.map((themeObj) => (
                      <SelectItem key={themeObj.value} value={themeObj.value}>
                        {themeObj.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </SelectTrigger>
              </Select>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t">
            <p className="text-sm text-muted-foreground">
              Les modifications sont sauvegardées automatiquement
            </p>
            <Checkbox
              checked={autoSave}
              onCheckedChange={(e) => handleAutoSaveToggle()}
              className="border-border"
            />
            <label className="text-sm text-muted-foreground cursor-auto">
              Auto-sauvegarde
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Paramètres de notification */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">
              Préférences de notification par email
            </p>
            <div className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Input
                  type="checkbox"
                  checked={notifications}
                  onCheckedChange={handleNotificationToggle}
                  className="border-border"
                />
                <span>Recevoir les notifications par email</span>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sécurité et compte */}
      <Card className="shadow-sm border border-border">
        <CardHeader>
          <CardTitle>Sécurité du compte</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="outline"
              size="full"
              onClick={() => window.location.href = "/dashboard/admin/profil/modifier-mot-de-passe"}
              className="grid grid-cols-2 gap-2"
            >
              <Settings className="size-4" />Modifier le mot de passe
            </Button>
            <Button
              variant="destructive"
              size="full"
              onClick={() => handleConfirmDeleteToggle()}
              className="grid grid-cols-2 gap-2"
            >
              <Trash2 className="size-4" />Supprimer le compte
            </Button>
          </div>

          {confirmDelete && (
            <div className="mt-4 p-4 bg-red-50 rounded-lg">
              <p className="text-red-600 text-sm mb-2">
                Êtes-vous sûr de vouloir supprimer votre compte administrateur ?
                Cette action est irréversible et supprimera toutes vos données.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={() => handleDeleteAccount()}>
                  Supprimer
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}