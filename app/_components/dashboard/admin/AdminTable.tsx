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
  const Row = onRowClick
    ? ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
        <TableRow
          {...props}
          className={cn("admin-table__tbody-tr", props.className)}
          onClick={(e) => {
            if (!(e.target as HTMLElement).closest("button,a,input,select,label")) {
              (props as any).onClick?.(e);
            }
          }}
        >
          {children}
        </TableRow>
      )
    : TableRow;

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
              data.map((item, index) => (
                <Row
                  key={keyExtractor(item)}
                  className={cn(rowClassName ? (typeof rowClassName === "function" ? rowClassName(item, index) : rowClassName) : "", onRowClick && "cursor-pointer")}
                  onClick={onRowClick ? () => onRowClick(item) : undefined}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key} className={cn("admin-table__td", col.className)}>
                      {col.render(item, index)}
                    </TableCell>
                  ))}
                </Row>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}