"use client";

import { cn } from "@/lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "@/components/ui/table";

interface AdminTableColumn<T> {
  key: string;
  header: string;
  render: (item: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface AdminTableProps<T> {
  columns: AdminTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  caption?: string;
  emptyMessage?: string;
  emptyIcon?: React.ReactNode;
  rowClassName?: string | ((item: T, index: number) => string);
  onRowClick?: (item: T) => void;
  stickyHeader?: boolean;
  className?: string;
}

// Composant stable (déclaré hors du rendu) : éviter de recréer le type de ligne
// à chaque changement d'état, ce qui démonterait toutes les lignes du tableau.
function ClickableRow({
  children,
  onActivate,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { onActivate: () => void }) {
  return (
    <TableRow
      {...props}
      role="button"
      tabIndex={0}
      className={cn("admin-table__tbody-tr", props.className)}
      onClick={(event) => {
        if (!(event.target as HTMLElement).closest("button,a,input,select,label")) {
          onActivate();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onActivate();
        }
      }}
    >
      {children}
    </TableRow>
  );
}

export function AdminTable<T>({
  columns,
  data,
  keyExtractor,
  caption,
  emptyMessage = "Aucune donnée disponible",
  emptyIcon,
  rowClassName,
  onRowClick,
  stickyHeader = false,
  className,
}: AdminTableProps<T>) {
  return (
    <div className={cn("admin-table", className)}>
      {caption && <TableCaption className="px-4 py-3 text-sm font-medium text-foreground">{caption}</TableCaption>}
      <div className="admin-table__wrap">
        <Table>
          <TableHeader className={stickyHeader ? "sticky top-0 z-10" : ""}>
            <TableRow className="admin-table__thead">
              {columns.map((col) => (
                <TableHead key={col.key} className={cn("admin-table__th", col.headerClassName)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="px-4 py-12 text-center">
                  <div className="admin-empty">
                    {emptyIcon && <div className="admin-empty__icon">{emptyIcon}</div>}
                    <p className="admin-empty__title">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              data.map((item, index) => {
                const rowClass = cn(
                  rowClassName
                    ? typeof rowClassName === "function"
                      ? rowClassName(item, index)
                      : rowClassName
                    : "",
                  onRowClick && "cursor-pointer"
                );
                const cells = columns.map((col) => (
                  <TableCell key={col.key} className={cn("admin-table__td", col.className)}>
                    {col.render(item, index)}
                  </TableCell>
                ));

                return onRowClick ? (
                  <ClickableRow
                    key={keyExtractor(item)}
                    className={rowClass}
                    onActivate={() => onRowClick(item)}
                  >
                    {cells}
                  </ClickableRow>
                ) : (
                  <TableRow key={keyExtractor(item)} className={rowClass}>
                    {cells}
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
