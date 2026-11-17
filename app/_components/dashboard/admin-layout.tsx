"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  User,
  Calendar,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Store,
  Package,
  Truck,
  Shield,
  Lock,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuthModal } from "@/lib/auth-context";
import type { DashboardUser } from "@/lib/auth-session";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { DashboardFooter } from "@/app/_components/dashboard/dashboard-footer";
import { ScrollToTop } from "@/app/_components/dashboard/scroll-to-top";
import { cn } from "@/lib/utils";
import { useNotificationUnreadCount } from "@/lib/use-notification-unread-count";

const ADMIN_NAV_ITEMS = [
  {
    key: "overview",
    href: "/dashboard/admin",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
    requiredPermission: null, // Always visible
  },
  {
    key: "utilisateurs",
    href: "/dashboard/admin/utilisateurs",
    label: "Gestion des utilisateurs",
    icon: Users,
    requiredPermission: "utilisateurs",
  },
  {
    key: "collaborateurs",
    href: "/dashboard/admin/collaborateurs",
    label: "Gestion des collaborateurs",
    icon: Shield,
    requiredPermission: "collaborateurs",
  },
  {
    key: "vendeurs",
    href: "/dashboard/admin/vendeurs",
    label: "Gestion des vendeurs",
    icon: Store,
    requiredPermission: "vendeurs",
  },
  {
    key: "reservations",
    href: "/dashboard/admin/reservations",
    label: "Gestion des réservations",
    icon: Calendar,
    requiredPermission: "reservations",
  },
  {
    key: "disponibilites",
    href: "/dashboard/admin/disponibilites",
    label: "Disponibilités",
    icon: Package,
    requiredPermission: "disponibilites",
  },
  {
    key: "publicite",
    href: "/dashboard/admin/publicite",
    label: "Annonces & publicités",
    icon: Truck,
    requiredPermission: "publicite",
  },
  {
    key: "analytics",
    href: "/dashboard/admin/analytics",
    label: "Rapports & statistiques",
    icon: Settings,
    requiredPermission: "statistiques",
  },
  {
    key: "profil",
    href: "/dashboard/admin/profil",
    label: "Mon profil",
    icon: User,
    requiredPermission: null, // Always visible
  },
] as const;

interface DashboardAdminLayoutProps {
  children: React.ReactNode;
  permissions: Set<string>;
  session?: DashboardUser | null;
  status?: "loading" | "authenticated" | "unauthenticated";
}

export function DashboardAdminLayout({
  children,
  permissions,
  session: sessionProp,
  status: statusProp,
}: DashboardAdminLayoutProps) {
  // Filter nav items based on permissions
  const allowedNavItems = ADMIN_NAV_ITEMS.filter(
    (item) => item.requiredPermission === null || permissions.has(item.requiredPermission)
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal, closeAuthModal } = useAuthModal();

  const user = sessionProp ?? undefined;
  const status = statusProp;
  const isAuthenticated = Boolean(user);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { unreadCount } = useNotificationUnreadCount(isAuthenticated);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const notificationsHref = "/dashboard/admin/notifications";

  // Synchroniser l'état disabled du bouton après hydratation pour éviter
  // un mismatch entre le rendu serveur (status undefined) et le client
  // (status "loading" au démarrage).
  useEffect(() => {
    setButtonDisabled(status === "loading");
  }, [status]);

  const isActive = (href: string) =>
    href === "/dashboard/admin" ? pathname === "/dashboard/admin" : pathname.startsWith(href);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const handleAuthClick = (mode: "login" | "register") => {
    if (!isAuthenticated) {
      openAuthModal(mode);
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("Veuillez sélectionner une image valide.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("L'image ne doit pas dépasser 5 Mo.");
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatarUrl(url);
  };

  const getUserAvatar = () => {
    if (avatarUrl) return avatarUrl;
    if (user?.image) return user.image;
    return null;
  };

  const getUserInitials = () => {
    return user?.name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || "A";
  };

  const handleProfileClick = () => {
    router.push("/dashboard/admin/profil");
  };

  const handleNotificationsClick = () => {
    router.push(notificationsHref);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - GAUCHE : unique navigation du dashboard administrateur */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Navigation du dashboard administrateur"
      >
        {/* Header with logo */}
        <div
          className={cn(
            "flex h-14 items-center justify-between border-b border-border px-4",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-5 w-5 object-contain"
              />
            </span>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight">GazPoints</span>
            )}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label={sidebarCollapsed ? "Étendre le menu" : "Réduire le menu"}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="size-4" aria-hidden />
            ) : (
              <ChevronLeft className="size-4" aria-hidden />
            )}
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Navigation principale">
          {allowedNavItems.map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.key}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Icon className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer de la sidebar : info utilisateur + déconnexion */}
        <div className={cn("border-t border-border p-3 space-y-2", sidebarCollapsed && "px-1")}>
          <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", sidebarCollapsed && "justify-center")}>
            <button
              type="button"
              onClick={handleProfileClick}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary cursor-pointer hover:bg-primary/20 transition-colors"
              aria-label="Aller à mon profil"
            >
              {status === "loading" ? (
                <div className="animate-pulse rounded-full bg-muted" />
              ) : getUserAvatar() ? (
                <Image
                  src={getUserAvatar()!}
                  alt="Avatar utilisateur"
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <User className="size-5 text-primary" aria-hidden="true" />
              )}
              <Bell className="size-2 absolute -right-0.5 -top-0.5 text-primary/60" />
            </button>
            {!sidebarCollapsed && (
              <div className="min-w-0 cursor-pointer" onClick={handleProfileClick}>
                {status === "loading" ? (
                  <div className="space-y-2">
                    <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                    <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
                  </div>
                ) : (
                  <>
                    <p className="truncate text-sm font-medium text-foreground hover:text-primary transition-colors">
                      {user?.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {user?.email} — {(user?.role ?? "admin") === "admin" ? "Administrateur" : "Collaborateur"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleNotificationsClick}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center px-1"
            )}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Notifications"}
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <Bell className={cn("size-4", sidebarCollapsed && "mx-auto")} aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-4 h-4 rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </span>
            {!sidebarCollapsed && <span>Notifications</span>}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center px-1"
            )}
            aria-label="Se déconnecter"
            disabled={buttonDisabled}
          >
            <LogOut className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Bouton menu mobile fixe (visible seulement sur mobile) */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Ouvrir le menu"
        className="fixed bottom-6 right-4 z-40 lg:hidden flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary-strong transition-colors"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      {/* Main content - occupe tout l'espace disponible à droite de la sidebar */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 lg:transition-all lg:duration-300 lg:ease-in-out",
        // Décalage dynamique selon l'état de la sidebar (desktop uniquement)
        sidebarCollapsed ? "lg:pl-16" : "lg:pl-64"
      )}>
        {/* Zone de contenu principale - flexible, s'adapte à la sidebar */}
        <main className="flex-1 overflow-auto">
          <div className="w-full max-w-screen-2xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer global unique */}
        <DashboardFooter />

        {/* Bouton flottant retour en haut */}
        <ScrollToTop />
      </div>
    </div>
  );
}