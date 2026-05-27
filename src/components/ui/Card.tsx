import { type ComponentPropsWithoutRef, type ElementType, type ReactNode } from "react";
import { cn } from "@/lib/cn";

type CardVariant = "default" | "elevated" | "interactive" | "preview" | "article";
type CardPadding = "none" | "sm" | "md" | "lg";

type CardProps<T extends ElementType = "div"> = {
  as?: T;
  variant?: CardVariant;
  padding?: CardPadding;
  className?: string;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "as" | "className" | "children">;

const variantClass: Record<CardVariant, string> = {
  default: "border border-[var(--color-border-default)] bg-[var(--color-surface-overlay)] shadow-[var(--shadow-card)]",
  elevated: "border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-md)]",
  interactive:
    "border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] shadow-[var(--shadow-card)] transition duration-[var(--duration-fast)] hover:-translate-y-0.5 hover:border-[var(--color-primary-border)] hover:shadow-[var(--shadow-md)]",
  preview: "border border-[var(--color-preview-border)] bg-[var(--color-preview-bg)] shadow-[var(--shadow-card)]",
  article: "border border-[var(--color-border-default)] bg-[var(--color-surface-base)] shadow-[var(--shadow-card)]",
};

const paddingClass: Record<CardPadding, string> = {
  none: "p-0",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card<T extends ElementType = "div">({
  as,
  variant = "default",
  padding = "md",
  className,
  children,
  ...props
}: CardProps<T>) {
  const Component = as ?? "div";

  return (
    <Component
      className={cn("rounded-[var(--radius-lg)]", variantClass[variant], paddingClass[padding], className)}
      {...props}
    >
      {children}
    </Component>
  );
}
