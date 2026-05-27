import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ControlGridProps = {
  columns?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
  compact?: boolean;
};

const columnClass: Record<NonNullable<ControlGridProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2",
  4: "grid-cols-1 sm:grid-cols-2",
};

export function ControlGrid({ columns = 2, children, className, compact = false }: ControlGridProps) {
  return <div className={cn("grid min-w-0", compact ? "gap-2" : "gap-3", columnClass[columns], className)}>{children}</div>;
}
