"use client"

import { useState } from "react"
import Link from "next/link"
import { Image as ImageIcon, RefreshCw, CheckCircle, X } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AdminStatsCards } from "./admin-stats-cards"
import { AvatarUploadDialog } from "./avatar-upload-dialog"
import { cn } from "@/lib/utils"

type Stats = {
  abonnes?: number
  vendeurs?: number
  utilisateurs?: number
  pointsDeVente?: number
  disponibilitesActives?: number
  bouteillesDisponibles?: number
  totalPageviews?: number
  uniquePageviews?: number
  totalSessions?: number
  avgSessionDuration?: number
  bounceRate?: number
  newVisitors7d?: number
  newVisitors30d?: number
  newVisitorsToday?: number
  mobileUsers?: number
  desktopUsers?: number
  tabletUsers?: number
  directTraffic?: number
  searchTraffic?: number
  socialTraffic?: number
  referralTraffic?: number
  campaignTraffic?: number
  trafficPercentages?: {
    direct?: number
    search?: number
    social?: number
    referral?: number
    campaign?: number
  }
  mostVisitedPages?: Array<{ path: string; views: number }>
  topExitPages?: Array<{ path: string; exits: number }>
}

export function AdminProfilWithAvatar({ stats }: { stats: Stats }) {
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false)
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const handleImageSave = async (imageUrl: string) => {
    setProfileImage(imageUrl)
    setAvatarDialogOpen(false)
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Statistiques</h1>
        <p className="mt-2 text-muted-foreground">
          Indicateurs globaux, trafic anonyme et tendances de la plateforme
        </p>
      </header>

      <AdminStatsCards stats={stats} />

      {/* Admin Avatar Section - moved from Mon profil */}
      <section aria-labelledby="admin-avatar-heading">
        <h2 id="admin-avatar-heading" className="text-xl font-semibold mb-4">
          Mon compte administrateur
        </h2>

        <div className="flex items-center gap-4">
          {/* Avatar with edit button */}
          <div className="relative">
            <Avatar className="w-16 h-16 rounded-full object-cover flex-shrink-0">
              {profileImage ? (
                <img
                  src={profileImage}
                  alt="Admin"
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <ImageIcon className="size-6" />
              )}
            </Avatar>

            {/* Edit avatar button */}
            <Button
              variant="outline"
              size="icon"
              aria-label="Modifier la photo de profil"
              onClick={() => setAvatarDialogOpen(true)}
              className="absolute right-1 top-1 flex items-center justify-center size-5"
            >
              <ImageIcon className="size-4" />
            </Button>
          </div>

          {/* User info */}
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium">Administrateur</p>
            <p className="text-sm text-muted-foreground">Gestion de la plateforme</p>
          </div>
        </div>
      </section>

      {/* Remaining profile settings - without avatar options */}
      <section aria-labelledby="profile-settings-heading">
        <h2 id="profile-settings-heading" className="text-xl font-semibold mb-4">
          Paramètres du compte
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {/* Name edit - simplified */}
          <Card>
            <CardHeader>
              <CardTitle>Nom</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Administrateur</p>
              <p className="text-xs text-gray-500">Le nom s'affiche sur le tableau de bord</p>
            </CardContent>
          </Card>

          {/* Email */}
          <Card>
            <CardHeader>
              <CardTitle>Email</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">admin@gazpoints.com</p>
              <p className="text-xs text-gray-500">Non modifiable depuis le profil</p>
            </CardContent>
          </Card>

          {/* Phone number */}
          <Card>
            <CardHeader>
              <CardTitle>Téléphone</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">Non fourni</p>
              <p className="text-xs text-gray-500">Peut être utilisé pour la vérification</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Image upload dialog */}
      <AvatarUploadDialog
        isOpen={avatarDialogOpen}
        onClose={() => setAvatarDialogOpen(false)}
        currentImage={profileImage}
        onImageSave={handleImageSave}
      />
    </div>
  )
}