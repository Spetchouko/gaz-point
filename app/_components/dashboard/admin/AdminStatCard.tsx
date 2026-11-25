"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";

interface AdminStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconColor?: "green" | "blue" | "orange" | "purple" | "red" | "emerald";
  label?: string;
  trend?: {
    value: number;
    label: string;
    up: boolean;
  };
  badge?: {
    label: string;
    variant?: "success" | "warning" | "destructive" | "info" | "neutral";
  };
  link?: string;
  loading?: boolean;
  className?: string;
}

export function AdminStatCard({
  title,
  value,
  icon,
  iconColor = "green",
  label,
  trend,
  badge,
  link,
  loading = false,
  className,
}: AdminStatCardProps) {
  const iconColorClasses = {
    green: "bg-green-50 text-green-700",
    blue: "bg-blue-50 text-blue-700",
    orange: "bg-orange-50 text-orange-700",
    purple: "bg-purple-50 text-purple-700",
    red: "bg-red-50 text-red-700",
    emerald: "bg-emerald-50 text-emerald-700",
  };

  const badgeVariants = {
    success: "admin-badge--success",
    warning: "admin-badge--warning",
    destructive: "admin-badge--destructive",
    info: "admin-badge--info",
    neutral: "admin-badge--neutral",
  };

  const Content = link ? (
    <Link href={link} className="block">
      <div className={cn("admin-stat-card group", className)}>
        {loading ? (
          <>
            <div className="admin-skeleton admin-skeleton--text mb-2" />
            <div className="admin-skeleton admin-skeleton--card" />
            <div className="admin-skeleton admin-skeleton--text mt-2 w-1/2" />
          </>
        ) : (
          <>
            <div className="flex items-start justify-between">
              <div className="min-w-0">
                <p className="admin-stat-card__label">{title}</p>
                <p className="admin-stat-card__value truncate">
                  {typeof value === "number" ? value.toLocaleString() : value}
                </p>
                {label && <p className="text-xs text-muted-foreground truncate mt-1">{label}</p>}
                {trend && (
                  <p className={cn("admin-stat-card__trend", trend.up ? "admin-stat-card__trend-up" : "admin-stat-card__trend-down")}>
                    {trend.up ? "▲" : "▼"} {trend.value?.toLocaleString() ?? "0"} {trend.label}
                  </p>
                )}
                {badge && (
                  <span className={cn("admin-badge mt-2", badgeVariants[badge.variant || "neutral"])}>
                    {badge.label}
                  </span>
                )}
              </div>
              <div className={cn("admin-stat-card__icon shrink-0", iconColorClasses[iconColor])}>
                {icon}
              </div>
            </div>
          </>
        )}
      </div>
    </Link>
  ) : (
    <div className={cn("admin-stat-card group", className)}>
      {loading ? (
        <>
          <div className="admin-skeleton admin-skeleton--text mb-2" />
          <div className="admin-skeleton admin-skeleton--card" />
          <div className="admin-skeleton admin-skeleton--text mt-2 w-1/2" />
        </>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <div className="min-w-0">
              <p className="admin-stat-card__label">{title}</p>
              <p className="admin-stat-card__value truncate">
                {typeof value === "number" ? value.toLocaleString() : value}
              </p>
              {label && <p className="text-xs text-muted-foreground truncate mt-1">{label}</p>}
              {trend && (
                <p className={cn("admin-stat-card__trend", trend.up ? "admin-stat-card__trend-up" : "admin-stat-card__trend-down")}>
                  {trend.up ? "▲" : "▼"} {trend.value?.toLocaleString() ?? "0"} {trend.label}
                </p>
              )}
              {badge && (
                <span className={cn("admin-badge mt-2", badgeVariants[badge.variant || "neutral"])}>
                  {badge.label}
                </span>
              )}
            </div>
            <div className={cn("admin-stat-card__icon shrink-0", iconColorClasses[iconColor])}>
              {icon}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return <>{Content}</>;
}