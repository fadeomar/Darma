import { type ReactNode } from "react";
import { cn } from "@/lib/cn";

export type ControlGridProps = {
  columns?: 1 | 2 | 3 | 4;
  children: ReactNode;
  className?: string;
};

const columnClass: Record<NonNullable<ControlGridProps["columns"]>, string> = {
  1: "grid-cols-1",
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

export function ControlGrid({ columns = 2, children, className }: ControlGridProps) {
  return <div className={cn("grid gap-3", columnClass[columns], className)}>{children}</div>;
}
