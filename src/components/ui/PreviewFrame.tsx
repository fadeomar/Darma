import { type HTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type PreviewFrameVariant = "default" | "studio" | "checkerboard" | "code" | "transparent";

const variantClass: Record<PreviewFrameVariant, string> = {
  default:
    "border border-[var(--color-tool-preview-border)] bg-[var(--color-tool-preview-bg)] shadow-[var(--shadow-tool-preview)]",
  studio:
    "border border-[var(--color-tool-preview-border)] bg-[var(--color-preview-bg-strong)] shadow-[var(--shadow-tool-preview)]",
  checkerboard: [
    "border border-[var(--color-tool-preview-border)]",
    "[background-image:linear-gradient(45deg,var(--color-preview-grid)_25%,transparent_25%),linear-gradient(-45deg,var(--color-preview-grid)_25%,transparent_25%),linear-gradient(45deg,transparent_75%,var(--color-preview-grid)_75%),linear-gradient(-45deg,transparent_75%,var(--color-preview-grid)_75%)]",
    "[background-size:20px_20px] [background-position:0_0,0_10px,10px_-10px,-10px_0px]",
    "bg-[var(--color-tool-preview-bg)] shadow-[var(--shadow-tool-preview)]",
  ].join(" "),
  code: "border border-[var(--color-code-border)] bg-[var(--color-code-bg)] text-[var(--color-code-text)] shadow-[var(--shadow-tool-preview)]",
  transparent: "border border-[var(--color-border-subtle)] bg-transparent shadow-none",
};

export function PreviewFrame({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLDivElement> & { variant?: PreviewFrameVariant }) {
  return (
    <div
      data-tool-region="preview"
      className={cn(
        "relative min-h-[var(--tool-preview-min-height)] min-w-0 overflow-hidden rounded-[var(--radius-lg)]",
        "ring-1 ring-inset ring-white/20 dark:ring-white/[0.03]",
        variantClass[variant],
        className,
      )}
      {...props}
    />
  );
}
