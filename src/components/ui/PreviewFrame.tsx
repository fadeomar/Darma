import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type PreviewFrameVariant = "default" | "studio" | "checkerboard" | "code" | "transparent";

const variantClass: Record<PreviewFrameVariant, string> = {
  default: "border border-[var(--color-preview-border)] bg-[var(--color-preview-bg)]",
  studio: "border border-[var(--color-preview-border)] bg-[var(--color-preview-bg-strong)]",
  checkerboard: [
    "border border-[var(--color-preview-border)]",
    "[background-image:linear-gradient(45deg,var(--color-preview-grid)_25%,transparent_25%),linear-gradient(-45deg,var(--color-preview-grid)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--color-preview-grid)_75%),linear-gradient(-45deg,transparent_75%,var(--color-preview-grid)_75%)]",
    "[background-size:20px_20px] [background-position:0_0,0_10px,10px_-10px,-10px_0px]",
    "bg-[var(--color-preview-bg)]",
  ].join(" "),
  code: "border border-[var(--color-code-border)] bg-[var(--color-code-bg)] text-[var(--color-code-text)]",
  transparent: "border border-[var(--color-border-subtle)] bg-transparent",
};

export function PreviewFrame({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: PreviewFrameVariant }) {
  return (
    <div
      className={cn(
        "min-h-[var(--tool-preview-min-height)] overflow-hidden rounded-[var(--radius-lg)] shadow-[var(--shadow-card)]",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
