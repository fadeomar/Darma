import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "soft" | "danger";
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
  primary:
    "border border-transparent bg-[var(--color-primary)] text-[var(--color-primary-text)] shadow-[var(--shadow-xs)] hover:bg-[var(--color-primary-hover)]",
  secondary:
    "border border-[var(--color-border-default)] bg-[var(--color-surface-raised)] text-[var(--color-text-primary)] shadow-[var(--shadow-xs)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-subtle)]",
  outline:
    "border border-[var(--color-border-default)] bg-transparent text-[var(--color-text-primary)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-control-hover)]",
  ghost:
    "border border-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-control-hover)] hover:text-[var(--color-text-primary)]",
  soft:
    "border border-[var(--color-primary-border)] bg-[var(--color-primary-soft)] text-[var(--color-primary-text-strong)] hover:border-[var(--color-primary)] hover:bg-[var(--color-control-active)]",
  danger:
    "border border-[var(--color-danger-border)] bg-[var(--color-danger-bg)] text-[var(--color-danger-text)] hover:border-[var(--color-danger)] hover:brightness-95",
};

const sizeClass: Record<ButtonSize, string> = {
  sm: "min-h-10 rounded-[var(--radius-sm)] px-3.5 text-sm",
  md: "min-h-11 rounded-[var(--radius-sm)] px-4 text-sm",
  lg: "min-h-11 rounded-[var(--radius-md)] px-5 text-base",
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
        "inline-flex items-center justify-center gap-2 font-semibold leading-none outline-none transition duration-[var(--duration-fast)] ease-[var(--ease-standard)] focus-visible:shadow-[var(--focus-ring)] disabled:opacity-45",
        "active:translate-y-px",
        variantClass[variant],
        sizeClass[size],
        fullWidth && "w-full",
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {size !== "icon" ? (
        children
      ) : leftIcon ? (
        // Icon-only button whose glyph came via `leftIcon`: children is just the
        // accessible label, so keep it screen-reader-only.
        <span className="sr-only">{children}</span>
      ) : (
        // Icon-only button whose glyph was passed as children: render it, or it
        // would be invisible. Pair with `aria-label` for the accessible name.
        children
      )}
      {rightIcon}
    </button>
  ),
);

Button.displayName = "Button";
