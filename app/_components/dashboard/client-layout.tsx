"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  User,
  Search,
  Calendar,
  History,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  X,
  Store,
  Package,
  Truck,
  Home,
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

const CLIENT_NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/profil",
    label: "Mon profil",
    icon: User,
  },
  {
    href: "/dashboard/recherches",
    label: "Mes recherches",
    icon: Search,
  },
  {
    href: "/dashboard/reservations",
    label: "Mes réservations",
    icon: Calendar,
  },
  {
    href: "/dashboard/historique",
    label: "Historique",
    icon: History,
  },
  {
    href: "/dashboard/notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    href: "/dashboard/parametres",
    label: "Paramètres",
    icon: Settings,
  },
  {
    href: "/",
    label: "Retour à l'accueil",
    icon: Home,
  },
] as const;

const VENDOR_NAV_ITEMS = [
  {
    href: "/dashboard/vendeur",
    label: "Vue d'ensemble",
    icon: LayoutDashboard,
  },
  {
    href: "/dashboard/depot",
    label: "Mon dépôt",
    icon: Store,
  },
  {
    href: "/dashboard/depot/disponibilites",
    label: "Mes disponibilités",
    icon: Package,
  },
  {
    href: "/dashboard/depot/services",
    label: "Mes services",
    icon: Truck,
  },
  {
    href: "/dashboard/depot/reservations",
    label: "Mes réservations",
    icon: Calendar,
  },
  {
    href: "/dashboard/historique",
    label: "Historique",
    icon: History,
  },
  {
    href: "/dashboard/vendeur/profil",
    label: "Mon profil",
    icon: User,
  },
] as const;

export function DashboardClientLayout({
  children,
  session: sessionProp,
  status: statusProp,
}: {
  children: React.ReactNode;
  session?: DashboardUser | null;
  status?: "loading" | "authenticated" | "unauthenticated";
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal, closeAuthModal } = useAuthModal();

  const user = sessionProp ?? undefined;
  const status = statusProp;
  const isAuthenticated = Boolean(user);
  const isVendor = user?.role === "vendor";
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { unreadCount } = useNotificationUnreadCount(isAuthenticated);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const notificationsHref = "/dashboard/notifications";

  // Synchroniser l'état disabled du bouton après hydratation pour éviter
  // un mismatch entre le rendu serveur (status undefined) et le client
  // (status "loading" au démarrage).
  useEffect(() => {
    setButtonDisabled(status === "loading");
  }, [status]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === "/dashboard" : pathname.startsWith(href);

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

  const handleProfileClick = () => {
    router.push("/dashboard/profil");
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
      .slice(0, 2) || "U";
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Desktop : à gauche, toujours visible, pliable.
           Mobile : à droite, en overlay, s'ouvre depuis la droite. */}
      <aside
        className={cn(
          "fixed inset-y-0 z-40 flex h-full flex-col bg-card transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64",
          // Desktop : bordure à droite de la sidebar, positionnée à gauche, toujours visible.
          "lg:left-0 lg:translate-x-0 lg:border-r lg:border-border",
          // Mobile : bordure à gauche de la sidebar, positionnée à droite, en overlay.
          "right-0 lg:right-auto border-l border-border",
          // Mobile : cachée par défaut, s'affiche quand sidebarOpen.
          // Desktop : toujours visible (lg:translate-x-0 l'emporte).
          sidebarOpen ? "translate-x-0" : "translate-x-full",
          "lg:translate-x-0"
        )}
        aria-label="Navigation du dashboard"
      >
        {/* Header with logo */}
        <div
          className={cn(
            "flex h-16 items-center justify-between border-b border-border px-4",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Link
            href="/dashboard"
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
          {(isVendor ? VENDOR_NAV_ITEMS : CLIENT_NAV_ITEMS).map((item) => {
            const active = isActive(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
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
          {isVendor && (
            <>
              <Link
                key="/dashboard/reservations/vendor"
                href="/dashboard/reservations/vendor"
                onClick={() => setSidebarOpen(false)}
                aria-current={pathname === "/dashboard/reservations/vendor" || pathname.startsWith("/dashboard/reservations/vendor") ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/dashboard/reservations/vendor" || pathname.startsWith("/dashboard/reservations/vendor")
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Calendar className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
                {!sidebarCollapsed && <span>Réservations dépôt</span>}
              </Link>
              <Link
                key="/dashboard/reservations/verify"
                href="/dashboard/reservations/verify"
                onClick={() => setSidebarOpen(false)}
                aria-current={pathname === "/dashboard/reservations/verify" ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  pathname === "/dashboard/reservations/verify"
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  sidebarCollapsed && "justify-center px-2"
                )}
              >
                <Search className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
                {!sidebarCollapsed && <span>Vérifier un code</span>}
              </Link>
            </>
          )}
        </nav>

        {/* Footer with user info and logout */}
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
                      {user?.email}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <Link
            href={notificationsHref}
            onClick={() => setSidebarOpen(false)}
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
          </Link>
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

      {/* Main content */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0",
        // Décalage dynamique vers la droite selon l'état de la sidebar (desktop uniquement).
        sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
      )}>
        {/* Top bar - Mobile menu button */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 lg:hidden">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Image
                src="/brand/logo.png"
                alt="GazPoints"
                width={24}
                height={24}
                className="h-5 w-5 object-contain"
              />
            </span>
            <span className="text-primary font-bold tracking-tight">GazPoints</span>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            aria-label="Ouvrir le menu"
            className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <Menu className="size-5" aria-hidden />
            <span className="sr-only">Menu</span>
          </button>
        </header>

        {/* Desktop top bar */}
        <header className="hidden lg:sticky lg:top-0 lg:z-10 lg:flex lg:h-14 lg:items-center lg:justify-between lg:border-b lg:border-border lg:bg-card/80 lg:backdrop-blur-md lg:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              {isVendor ? "Espace Vendeur" : "Espace Client"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/recherches")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Nouvelle recherche"
            >
              <Search className="size-4" />
              Recherche
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/reservations")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Mes réservations"
            >
              <Calendar className="size-4" />
              Réservations
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 rounded-lg px-3 py-2 bg-primary/10 text-primary text-sm font-medium cursor-pointer" onClick={handleProfileClick}>
              {status === "loading" ? (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted animate-pulse" />
              ) : (
                <>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    {getUserAvatar() ? (
                      <Image
                        src={getUserAvatar()!}
                        alt="Avatar utilisateur"
                        width={24}
                        height={24}
                        className="size-6 rounded-full object-cover"
                      />
                    ) : (
                      <User className="size-5 text-primary" aria-hidden="true" />
                    )}
                  </span>
                  <span className="hidden sm:block font-medium hover:text-primary-foreground transition-colors">
                    {user?.name}
                  </span>
                </>
              )}
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => router.push(notificationsHref)}
                className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Notifications"
              >
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 size-2.5 rounded-full bg-destructive text-white text-[10px] leading-none">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Footer public */}
        <DashboardFooter />

        {/* Bouton flottant retour en haut */}
        <ScrollToTop />
      </div>
    </div>
  );
}