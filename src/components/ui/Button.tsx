import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "soft" | "danger";
type ButtonSize = "sm" | "md" | "lg" | "icon";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
};

const variantClass: Record<ButtonVariant, string> = {
  primary: "bg-[var(--color-primary)] text-[var(--color-primary-text)] hover:bg-[var(--color-primary-hover)]",
  secondary: "border border-[var(--color-border)] bg-[var(--color-surface-strong)] text-[var(--color-text)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-muted)]",
  ghost: "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-muted)] hover:text-[var(--color-text)]",
  soft: "bg-[var(--color-bg-soft)] text-[var(--color-text)] hover:bg-[var(--color-surface-strong)]",
  danger: "bg-[var(--color-danger)] text-white hover:brightness-95",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-[var(--radius-sm)] px-3 text-sm",
  md: "min-h-11 rounded-[var(--radius-sm)] px-4 text-sm",
  lg: "min-h-12 rounded-[var(--radius-md)] px-5 text-base",
  icon: "h-10 w-10 rounded-[var(--radius-sm)] p-0",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      fullWidth,
      loading,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 font-semibold transition duration-[var(--duration-fast)] ease-[var(--ease-standard)] disabled:opacity-45",
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {size !== "icon" ? children : <span className="sr-only">{children}</span>}
      {rightIcon}
    </button>
  ),
);

Button.displayName = "Button";
