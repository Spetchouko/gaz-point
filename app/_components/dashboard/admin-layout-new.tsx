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
  BarChart3,
  MapPin,
  Archive,
  X,
  Search,
} from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useAuthModal } from "@/lib/auth-context";
import type { DashboardUser } from "@/lib/auth-session";
import { useDashboardSession } from "@/lib/auth-session";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { DashboardFooter } from "@/app/_components/dashboard/dashboard-footer";
import { ScrollToTop } from "@/app/_components/dashboard/scroll-to-top";
import { cn } from "@/lib/utils";
import { useNotificationUnreadCount } from "@/lib/use-notification-unread-count";

// Monogramme EA pour l'espace administrateur
const EA_MONOGRAM = (
  <svg
    width="28"
    height="28"
    viewBox="0 0 28 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-primary"
  >
    <rect width="28" height="28" rx="6" fill="currentColor" opacity="0.1" />
    <text
      x="50%"
      y="54%"
      dominantBaseline="middle"
      textAnchor="middle"
      fontFamily="system-ui, -apple-system, sans-serif"
      fontSize="14"
      fontWeight="700"
      fill="currentColor"
      letterSpacing="-0.02em"
    >
      EA
    </text>
  </svg>
);

// Navigation items organized by functional groups
const ADMIN_NAV_GROUPS = [
  {
    groupLabel: "TABLEAU DE BORD",
    items: [
      {
        key: "overview",
        href: "/dashboard/admin",
        label: "Vue d'ensemble",
        icon: LayoutDashboard,
        requiredPermission: null,
      },
      {
        key: "analytics",
        href: "/dashboard/admin/analytics",
        label: "Rapports & Statistiques",
        icon: BarChart3,
        requiredPermission: "statistiques",
      },
    ],
  },
  {
    groupLabel: "GESTION DES UTILISATEURS",
    items: [
      {
        key: "utilisateurs",
        href: "/dashboard/admin/utilisateurs",
        label: "Utilisateurs",
        icon: Users,
        requiredPermission: "utilisateurs",
      },
      {
        key: "vendeurs",
        href: "/dashboard/admin/vendeurs",
        label: "Vendeurs",
        icon: Store,
        requiredPermission: "vendeurs",
      },
      {
        key: "collaborateurs",
        href: "/dashboard/admin/collaborateurs",
        label: "Collaborateurs",
        icon: Shield,
        requiredPermission: "collaborateurs",
      },
    ],
  },
  {
    groupLabel: "GESTION DES OPÉRATIONS",
    items: [
      {
        key: "points-de-vente",
        href: "/dashboard/admin/points-de-vente",
        label: "Points de vente",
        icon: MapPin,
        requiredPermission: "vendeurs",
      },
      {
        key: "disponibilites",
        href: "/dashboard/admin/disponibilites",
        label: "Disponibilités",
        icon: Package,
        requiredPermission: "disponibilites",
      },
      {
        key: "reservations",
        href: "/dashboard/admin/reservations",
        label: "Réservations",
        icon: Calendar,
        requiredPermission: "reservations",
      },
    ],
  },
  {
    groupLabel: "CONTENU & MARKETING",
    items: [
      {
        key: "publicite",
        href: "/dashboard/admin/publicite",
        label: "Annonces & Publicités",
        icon: Truck,
        requiredPermission: "publicite",
      },
    ],
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { openAuthModal, closeAuthModal } = useAuthModal();
  const [avatarMenuOpen, setAvatarMenuOpen] = useState(false);

  const user = sessionProp ?? undefined;
  const status = statusProp;
  const isAuthenticated = Boolean(user);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const { unreadCount } = useNotificationUnreadCount(isAuthenticated);
  const [buttonDisabled, setButtonDisabled] = useState(false);
  const notificationsHref = "/dashboard/admin/notifications";

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

  // Flatten nav items for active state checking
  const allNavItems = ADMIN_NAV_GROUPS.flatMap((group) => group.items);
  const allowedNavItems = allNavItems.filter(
    (item) => item.requiredPermission === null || permissions.has(item.requiredPermission)
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Navigation administrateur */}
      <aside
        id="admin-sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex h-full flex-col bg-card border-r border-border transition-all duration-300 ease-in-out",
          sidebarCollapsed ? "w-16" : "w-64",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
        aria-label="Navigation du dashboard administrateur"
      >
        {/* Header with EA Monogram */}
        <div
          className={cn(
            "flex h-16 items-center justify-between border-b border-border px-4",
            sidebarCollapsed && "justify-center px-0"
          )}
        >
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              {EA_MONOGRAM}
            </span>
            {!sidebarCollapsed && (
              <span className="font-bold text-lg tracking-tight">Espace Admin</span>
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

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-4" aria-label="Navigation principale">
          {ADMIN_NAV_GROUPS.map((group) => {
            const allowedItems = group.items.filter(
              (item) => item.requiredPermission === null || permissions.has(item.requiredPermission)
            );
            if (allowedItems.length === 0) return null;

            return (
              <div key={group.groupLabel} className="space-y-1">
                {!sidebarCollapsed && (
                  <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                    {group.groupLabel}
                  </p>
                )}
                <div className="space-y-0.5">
                  {allowedItems.map((item) => {
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
                            ? "bg-primary/10 text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          sidebarCollapsed && "justify-center px-2"
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", sidebarCollapsed && "mx-auto")} aria-hidden />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer: User Info + Actions */}
        <div className={cn("border-t border-border p-3 space-y-2", sidebarCollapsed && "px-1")}>
          {/* Profile Button */}
          <button
            type="button"
            onClick={handleProfileClick}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              "text-muted-foreground hover:bg-muted hover:text-foreground",
              sidebarCollapsed && "justify-center px-1"
            )}
            aria-label="Mon profil"
          >
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
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
            </span>
            {!sidebarCollapsed && (
              <div className="min-w-0 flex-1 text-left">
                <p className="truncate text-sm font-medium text-foreground">
                  {user?.name || "Administrateur"}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {user?.role === "collaborateur" ? "Collaborateur" : "Administrateur"}
                </p>
              </div>
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={handleNotificationsClick}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              "sidebarCollapsed && justify-center px-1"
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

          {/* Logout */}
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

          {/* Footer - Simple comme le dashboard vendeur */}
          <div className={cn("border-t border-border pt-3", sidebarCollapsed && "hidden")}>
            <p className="text-xs text-muted-foreground text-center">
              © {new Date().getFullYear()} GazPoints. Tous droits réservés.
            </p>
            <p className="text-xs text-muted-foreground text-center mt-1">
              Fait pour faciliter l'accès au gaz au Cameroun.
            </p>
          </div>
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

      {/* Mobile menu button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        aria-label="Ouvrir le menu"
        className="fixed bottom-6 right-4 z-40 lg:hidden flex size-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors"
      >
        <Menu className="size-6" aria-hidden />
      </button>

      {/* Main content area */}
      <div className={cn(
        "flex-1 flex flex-col min-w-0 lg:transition-all lg:duration-300 lg:ease-in-out",
        sidebarCollapsed ? "lg:pl-[calc(4rem+1px)]" : "lg:pl-[calc(16rem+1px)]"
      )}>
        {/* Unified Top Bar - Desktop & Mobile */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 lg:px-8">
          {/* Left: Logo + Label + Search + Reservations */}
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Link
              href="/dashboard/admin"
              className="flex items-center gap-2 font-bold text-lg"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                {EA_MONOGRAM}
              </span>
              <span className="font-bold text-lg tracking-tight hidden sm:inline">Espace administrateur</span>
            </Link>

            {/* Search - hidden on mobile, visible on tablet+ */}
            <div className="hidden md:block relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" aria-hidden="true" />
              <input
                type="search"
                placeholder="Rechercher..."
                className="w-full pl-10 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    router.push(`/dashboard/recherches?q=${encodeURIComponent(e.currentTarget.value)}`);
                  }
                }}
              />
            </div>

            {/* Quick actions: Search (mobile), Reservations */}
            <div className="flex items-center gap-2 md:hidden">
              <button
                type="button"
                onClick={() => router.push("/dashboard/recherches")}
                className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                aria-label="Rechercher"
              >
                <Search className="size-4" />
              </button>
            </div>

            <Link
              href="/dashboard/admin/reservations"
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors hidden sm:flex"
            >
              <Calendar className="size-4" />
              <span>Réservations</span>
            </Link>
          </div>

          {/* Right: Notifications + Avatar Menu */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button
              type="button"
              onClick={handleNotificationsClick}
              className="relative flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Notifications"}
            >
              <Bell className="size-5" aria-hidden />
              {unreadCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 min-w-4 h-4 rounded-full bg-destructive px-1 text-[10px] font-semibold leading-4 text-white text-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>

            {/* Avatar Menu */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setAvatarMenuOpen(true)}
                className="flex items-center gap-2 rounded-lg px-3 py-2 bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
              >
                {status === "loading" ? (
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted animate-pulse" />
                ) : getUserAvatar() ? (
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
              </button>
              {avatarMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-40 bg-black/30 lg:hidden"
                    onClick={() => setAvatarMenuOpen(false)}
                    aria-hidden="true"
                  />
                  <div className="fixed right-0 top-14 lg:right-0 lg:w-56 lg:border-l lg:border-border lg:bg-card lg:shadow-lg max-h-[calc(100vh-56px)] overflow-y-auto">
                    <div className="p-4 space-y-2 text-sm">
                      <p className="font-medium text-foreground">{user?.name || "Administrateur"}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                      <p className="text-xs text-muted-foreground capitalize">{user?.role === "collaborateur" ? "Collaborateur" : "Administrateur"}</p>
                      <Button
                        variant="outline"
                        className="w-full py-2 px-3 rounded-md hover:bg-muted transition-colors text-sm"
                        onClick={() => { setAvatarMenuOpen(false); router.push("/dashboard/admin/profil"); }}
                      >
                        Mon profil
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full py-2 px-3 rounded-md hover:bg-muted transition-colors text-sm"
                        onClick={() => { setAvatarMenuOpen(false); router.push("/dashboard/admin/notifications"); }}
                      >
                        Notifications
                      </Button>
                      <Button
                        variant="destructive"
                        className="w-full py-2 px-3 rounded-md hover:bg-destructive/10 transition-colors text-sm"
                        onClick={() => { setAvatarMenuOpen(false); handleSignOut(); }}
                      >
                        Déconnexion
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>

        {/* Scroll to top button */}
        <ScrollToTop />
      </div>
    </div>
  );
}