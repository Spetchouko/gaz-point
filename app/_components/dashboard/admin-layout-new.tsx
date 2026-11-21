"use client";

import { useState } from "react";
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
  MessageSquare,
  CreditCard,
} from "lucide-react";
import { ThemeProvider } from "@/app/_components/theme-provider";
import { Button } from "@/components/ui/button";
import type { DashboardUser } from "@/lib/auth-session";
import { useDashboardSession } from "@/lib/auth-session";
import { authClient } from "@/lib/auth-client";
import { DashboardFooter } from "@/app/_components/dashboard/dashboard-footer";
import { ScrollToTop } from "@/app/_components/dashboard/scroll-to-top";
import { DashboardQuickActions } from "@/app/_components/dashboard/dashboard-quick-actions";
import { cn } from "@/lib/utils";
import { useNotificationUnreadCount } from "@/lib/use-notification-unread-count";

const SIDEBAR_LOGO = (
  <Image
    src="/brand/logo.png"
    alt="GazPoints"
    width={24}
    height={24}
    className="h-6 w-6 object-contain"
  />
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
  {
    groupLabel: "AVIS & RÉPUTATION",
    items: [
      {
        key: "avis",
        href: "/dashboard/admin/avis",
        label: "Gestion des avis",
        icon: MessageSquare,
        requiredPermission: "avis",
      },
    ],
  },
  {
    groupLabel: "ABONNEMENTS",
    items: [
      {
        key: "abonnements",
        href: "/dashboard/admin/abonnements",
        label: "Abonnements",
        icon: CreditCard,
        requiredPermission: "abonnements",
      },
    ],
  },
] as const;

interface DashboardAdminLayoutInnerProps {
  children: React.ReactNode;
  permissions: Set<string>;
  session?: DashboardUser | null;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  user: DashboardUser | undefined;
  status: "loading" | "authenticated" | "unauthenticated";
  unreadCount: number;
  buttonDisabled: boolean;
}

type UseAdminClientHooksArgs = {
  user: DashboardUser | undefined;
};

function useAdminClientHooks({ user }: UseAdminClientHooksArgs) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string) =>
    href === "/dashboard/admin" ? pathname === "/dashboard/admin" : pathname.startsWith(href);

  const handleSignOut = async () => {
    await authClient.signOut();
    router.push("/");
    router.refresh();
  };

  const getUserAvatar = () => user?.image ?? null;

  const getUserInitials = () => {
    return user?.name
      ?.split(" ")
      .map((part) => part.charAt(0).toUpperCase())
      .join("") || "A";
  };

  const handleProfileClick = () => {
    router.push("/dashboard/admin/profil");
  };

  const handleNotificationsClick = () => {
    router.push("/dashboard/admin/notifications");
  };

  return {
    isActive,
    handleSignOut,
    getUserAvatar,
    getUserInitials,
    handleProfileClick,
    handleNotificationsClick,
  };
}

export function DashboardAdminLayoutInner({
  children,
  permissions,
  session,
  sidebarCollapsed,
  setSidebarCollapsed,
  sidebarOpen,
  setSidebarOpen,
  user,
  status: statusProp,
  unreadCount,
  buttonDisabled,
}: DashboardAdminLayoutInnerProps) {
  const hooks = useAdminClientHooks({ user });
  const { isActive, handleSignOut } = hooks;
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar - Reprise du design du dashboard client */}
      <aside
        className={cn(
          "fixed inset-y-0 z-40 flex h-full flex-col bg-card transition-all duration-300 ease-in-out",
          "left-0 lg:left-auto lg:border-l-0 lg:border-r",
          "w-64",
          "sidebarOpen:translate-x-0",
          "sidebarCollapsed:w-16",
          "lg:translate-x-0"
        )}
        aria-label="Navigation du dashboard administrateur"
      >
        {/* Header with logo */}
        <div className={cn("flex h-16 items-center justify-between border-b border-border px-4", "sidebarCollapsed && justify-center px-0")}>
          <Link
            href="/dashboard/admin"
            className="flex items-center gap-2 font-bold text-lg"
            onClick={() => setSidebarOpen(false)}
          >
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
              {SIDEBAR_LOGO}
            </span>
            {!sidebarCollapsed && <span className="font-bold text-lg tracking-tight">GazPoints</span>}
          </Link>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Fermer le menu"
            className="p-2 rounded-lg text-muted-foreground hover:bg-muted"
          >
            <ChevronLeft className="size-4" aria-hidden />
          </button>
        </div>

        {/* Navigation Groups */}
        <nav className="flex-1 overflow-y-auto p-2 space-y-1" aria-label="Navigation principale">
          {ADMIN_NAV_GROUPS.map((group) => {
            const allowedItems = group.items.filter(
              (item) => item.requiredPermission === null || permissions.has(item.requiredPermission)
            );
            if (allowedItems.length === 0) return null;

            return (
              <div key={group.groupLabel} className="admin-sidebar__group">
                <p className="admin-sidebar__group-label">{group.groupLabel}</p>
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
                          active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          "sidebarCollapsed && justify-center px-2"
                        )}
                      >
                        <Icon className={cn("size-4 shrink-0", "sidebarCollapsed && mx-auto")} aria-hidden />
                        {!sidebarCollapsed && <span>{item.label}</span>}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Footer with user info and logout */}
        <div className={cn("border-t border-border p-3 space-y-2", "sidebarCollapsed && px-1")}>
          <div className={cn("flex items-center gap-3 rounded-lg px-3 py-2", "sidebarCollapsed && justify-center")}>
            <button
              type="button"
              onClick={hooks.handleProfileClick}
              className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary cursor-pointer hover:bg-primary/20 transition-colors"
              aria-label="Aller à mon profil"
            >
              {statusProp === "loading" ? (
                <div className="animate-pulse rounded-full bg-muted" />
              ) : user?.image ? (
                <Image
                  src={user.image}
                  alt="Avatar utilisateur"
                  width={32}
                  height={32}
                  className="size-8 rounded-full object-cover"
                />
              ) : (
                <User className="size-5 text-primary" aria-hidden="true" />
              )}
            </button>
            <Bell className="size-2 absolute -right-0.5 -top-0.5 text-primary/60" />
            {!sidebarCollapsed && (
              <div className="min-w-0 cursor-pointer" onClick={hooks.handleProfileClick}>
                {statusProp === "loading" ? (
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
                      {user?.role === "collaborateur" ? "Collaborateur" : "Administrateur"}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
          <Link
            href="/dashboard/admin/notifications"
            onClick={() => setSidebarOpen(false)}
            className={cn(
              "relative flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              "sidebarCollapsed && justify-center px-1"
            )}
            aria-label={unreadCount > 0 ? `Notifications, ${unreadCount} non lue${unreadCount > 1 ? "s" : ""}` : "Notifications"}
          >
            <span className="relative flex size-4 shrink-0 items-center justify-center">
              <Bell className={cn("size-4", "sidebarCollapsed && mx-auto")} aria-hidden />
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
            onClick={hooks.handleSignOut}
            className={cn(
              "flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              "sidebarCollapsed && justify-center px-1"
            )}
            aria-label="Se déconnecter"
            disabled={buttonDisabled}
          >
            <LogOut className={cn("size-4 shrink-0", "sidebarCollapsed && mx-auto")} aria-hidden />
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
        "dashboard-surface flex-1 flex flex-col min-w-0",
        "lg:ml-[calc(16rem+1px)]"
      )}>
        {/* Top bar - Mobile menu button */}
        <header className={cn(
          "sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 backdrop-blur-md px-4 sm:px-6 lg:px-8 lg:hidden"
        )}>
          <Link
            href="/dashboard/admin"
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
                style={{ width: "auto", height: "auto" }}
              />
            </span>
            <span className="text-primary font-bold tracking-tight">GazPoints</span>
          </Link>
          <div className="flex items-center gap-1">
            <DashboardQuickActions />
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Ouvrir le menu"
              className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Menu className="size-5" aria-hidden />
              <span className="sr-only">Menu</span>
            </button>
          </div>
        </header>

        {/* Desktop top bar */}
        <header className={cn(
          "hidden lg:sticky lg:top-0 lg:z-10 lg:flex lg:h-14 lg:items-center lg:justify-between lg:border-b lg:border-border lg:bg-card/80 lg:backdrop-blur-md lg:px-6 lg:px-8"
        )}>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-muted-foreground">
              {session?.role === "admin" ? "Espace Administrateur" : "Espace Administrateur"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Tableau de bord"
            >
              <LayoutDashboard className="size-4" />
              Accueil
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin/analytics")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Rapports"
            >
              <BarChart3 className="size-4" />
              Rapports
            </Button>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin/utilisateurs")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Utilisateurs"
            >
              <Users className="size-4" />
              Utilisateurs
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/dashboard/admin/vendeurs")}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted"
              aria-label="Vendeurs"
            >
              <Store className="size-4" />
              Vendeurs
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <DashboardQuickActions />
            <div
              className="flex items-center gap-3 rounded-lg px-3 py-2 bg-primary/10 text-primary text-sm font-medium cursor-pointer"
              onClick={hooks.handleProfileClick}
            >
              {statusProp === "loading" ? (
                <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted animate-pulse" />
              ) : user?.image ? (
                <Image
                  src={user.image}
                  alt="Avatar utilisateur"
                  width={24}
                  height={24}
                  className="size-5 rounded-full object-cover"
                />
              ) : (
                <User className="size-5 text-primary" aria-hidden="true" />
              )}
              <span className="hidden sm:block font-medium hover:text-primary-foreground transition-colors">
                {user?.name}
              </span>
            </div>
            <div className="relative">
              <button
                type="button"
                onClick={() => router.push("/dashboard/admin/notifications")}
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
              onClick={hooks.handleSignOut}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-4 aria-hidden" />
              <span className="hidden sm:inline">Déconnexion</span>
            </button>
          </div>
        </header>

        {/* Main content area */}
        <main className="admin-workarea__main">
          <div className="admin-workarea__padding">
            {children}
          </div>
        </main>

        {/* Footer public */}
        <DashboardFooter />

        {/* Scroll to top button */}
        <ScrollToTop />
      </div>
    </div>
  );
}

type DashboardAdminLayoutProps = {
  children: React.ReactNode;
  permissions: Set<string>;
  session?: DashboardUser | null;
  status: "loading" | "authenticated" | "unauthenticated";
};

export function DashboardAdminLayout({
  children,
  permissions,
  session,
  status,
}: DashboardAdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const unreadCount = useNotificationUnreadCount(Boolean(session)).unreadCount;

  return (
    <ThemeProvider>
      <DashboardAdminLayoutInner
        permissions={permissions}
        session={session}
        status={status}
        sidebarCollapsed={sidebarCollapsed}
        setSidebarCollapsed={setSidebarCollapsed}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        user={session ?? undefined}
        unreadCount={unreadCount}
        buttonDisabled={status === "loading"}
      >
        {children}
      </DashboardAdminLayoutInner>
    </ThemeProvider>
  );
}

export function DashboardAdminLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { status, user } = useDashboardSession();

  return (
    <DashboardAdminLayout
      permissions={new Set<string>()}
      session={user}
      status={status}
    >
      {children}
    </DashboardAdminLayout>
  );
}