import type { ButtonGeneratorConfig } from "./types";
import { safeClassName } from "./generators";

export type ButtonVisualState = "default" | "hover" | "active" | "focus" | "disabled" | "loading";

export function getPreviewButtonClasses(config: ButtonGeneratorConfig, state: ButtonVisualState = "default") {
  const classes = [safeClassName(config.className)];
  if (state === "hover") classes.push("is-preview-hover");
  if (state === "active") classes.push("is-preview-active");
  if (state === "focus") classes.push("is-preview-focus");
  return classes.join(" ");
}

export function ButtonPreviewElement({ config, state = "default", className = "" }: { config: ButtonGeneratorConfig; state?: ButtonVisualState; className?: string }) {
  const isLoading = state === "loading" || config.loading;
  const isDisabled = state === "disabled" || config.disabled || isLoading;
  const usesIcon = config.contentMode === "text-icon" || config.contentMode === "icon-only";
  const icon = usesIcon ? <span className={`${safeClassName(config.className)}__icon`} aria-hidden="true">{config.iconSymbol || "→"}</span> : null;
  const spinner = isLoading ? <span className={`${safeClassName(config.className)}__spinner`} aria-hidden="true" /> : null;
  const accessibleLabel = config.text.trim() || "Button";
  const label = config.contentMode === "icon-only"
    ? <span className={`${safeClassName(config.className)}__sr-only`}>{accessibleLabel}</span>
    : accessibleLabel;

  return (
    <button
      type="button"
      className={`${getPreviewButtonClasses(config, state)} ${className}`.trim()}
      disabled={isDisabled}
      aria-disabled={isDisabled || undefined}
      aria-busy={isLoading || undefined}
      aria-label={config.contentMode === "icon-only" ? accessibleLabel : undefined}
    >
      {config.iconPosition === "left" ? <>{icon}{spinner}{label}</> : <>{spinner}{label}{icon}</>}
    </button>
  );
}
