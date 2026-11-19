"use client";

import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";

interface AdminCardProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
  headerClassName?: string;
  contentClassName?: string;
  hover?: boolean;
}

export function AdminCard({
  title,
  description,
  icon,
  children,
  headerAction,
  footer,
  className,
  headerClassName,
  contentClassName,
  hover = false,
}: AdminCardProps) {
  return (
    <Card className={cn("admin-card", hover && "hover:shadow-md transition-shadow cursor-pointer", className)}>
      {(title || description || headerAction || icon) && (
        <CardHeader className={cn("admin-card__header", headerClassName)}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {icon && (
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-700">
                {icon}
              </span>
            )}
            <div className="min-w-0">
              {title && <CardTitle className="admin-card__title">{title}</CardTitle>}
              {description && <CardDescription className="admin-card__description">{description}</CardDescription>}
            </div>
          </div>
          {headerAction && <div className="shrink-0">{headerAction}</div>}
        </CardHeader>
      )}
      <CardContent className={cn("admin-card__content", contentClassName)}>{children}</CardContent>
      {footer && <CardFooter className="flex items-center justify-end gap-2 p-4 border-t border-border">{footer}</CardFooter>}
    </Card>
  );
}