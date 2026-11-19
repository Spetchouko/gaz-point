"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";

interface AdminPageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  breadcrumb?: Array<{
    label: string;
    href?: string;
    icon?: React.ReactNode;
    subtitle?: string;
  }>;
  className?: string;
}

export function AdminPageHeader({
  title,
  subtitle,
  icon,
  actions,
  breadcrumb,
  className,
}: AdminPageHeaderProps) {
  return (
    <div className={cn("admin-page-header dashboard-card", className)}>
      {breadcrumb && breadcrumb.length > 0 && (
        <nav className="flex items-center gap-1 text-xs text-muted-foreground mb-2" aria-label="Fil d'Ariane">
          {breadcrumb.map((item, index) => {
            // Le premier fil d'Ariane de l'espace admin affiche un bloc complet
            // (icône + titre + description) au lieu du simple libellé "Dashboard".
            const isDashboardCrumb = item.href === "/dashboard/admin";
            const crumbIcon =
              item.icon ??
              (isDashboardCrumb ? <LayoutDashboard className="size-4 shrink-0 text-primary" aria-hidden /> : null);
            const crumbSubtitle =
              item.subtitle ??
              (isDashboardCrumb
                ? "Statistiques et activité de la plateforme GazPoints"
                : undefined);

            const content = (
              <span className="flex items-center gap-2">
                {crumbIcon}
                <span className="flex flex-col leading-tight">
                  <span className={cn("text-sm", isDashboardCrumb ? "font-semibold text-foreground" : "font-medium")}>
                    {isDashboardCrumb ? "Tableau de bord" : item.label}
                  </span>
                  {crumbSubtitle && (
                    <span className="text-[11px] font-normal text-muted-foreground">
                      {crumbSubtitle}
                    </span>
                  )}
                </span>
              </span>
            );

            return (
              <span key={item.label} className="flex min-w-0 items-center gap-1">
                {index > 0 && <span className="shrink-0 text-muted-foreground/50">/</span>}
                {item.href ? (
                  <Link href={item.href} className="flex min-w-0 items-center rounded-md transition-colors hover:text-foreground">
                    {content}
                  </Link>
                ) : (
                  <span className="text-foreground">{content}</span>
                )}
              </span>
            );
          })}
        </nav>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          {icon && <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">{icon}</div>}
          <div>
            <h1 className="admin-page-title">{title}</h1>
            {subtitle && <p className="admin-page-subtitle mt-1">{subtitle}</p>}
          </div>
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
    </div>
  );
}