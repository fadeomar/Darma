import { Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { CSP_SERVICES } from "../services";

export function CspServicesStep({
  enabled,
  onToggle,
}: {
  enabled: string[];
  onToggle: (id: string) => void;
}) {
  const enabledSet = new Set(enabled);
  const notes = CSP_SERVICES.filter((service) => enabledSet.has(service.id) && service.note);

  return (
    <div className="space-y-3">
      <div className="grid gap-2.5 sm:grid-cols-2">
        {CSP_SERVICES.map((service) => {
          const active = enabledSet.has(service.id);
          return (
            <button
              key={service.id}
              type="button"
              role="checkbox"
              aria-checked={active}
              onClick={() => onToggle(service.id)}
              className={cn(
                "flex items-start gap-3 rounded-[var(--radius-md)] border p-3 text-left transition focus:outline-none focus:shadow-[var(--focus-ring)]",
                active
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
                  : "border-[var(--color-border-default)] bg-[var(--color-surface-base)] hover:border-[var(--color-border-strong)]",
              )}
            >
              <span aria-hidden className="text-lg leading-none">{service.icon}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-[var(--color-text-primary)]">{service.label}</span>
                  <span
                    className={cn(
                      "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border",
                      active ? "border-[var(--color-primary)] bg-[var(--color-primary)] text-[var(--color-primary-text)]" : "border-[var(--color-border-strong)] bg-[var(--color-surface-raised)]",
                    )}
                  >
                    {active ? <Check className="h-3 w-3" aria-hidden /> : null}
                  </span>
                </span>
                <span className="mt-0.5 block text-xs leading-5 text-[var(--color-text-secondary)]">{service.description}</span>
              </span>
            </button>
          );
        })}
      </div>

      {notes.length ? (
        <div className="space-y-1.5">
          {notes.map((service) => (
            <p key={service.id} className="rounded-[var(--radius-sm)] border border-[var(--color-info-border)] bg-[var(--color-info-bg)] px-2.5 py-1.5 text-[11px] leading-4 text-[var(--color-info-text)]">
              <span className="font-bold">{service.label}:</span> {service.note}
            </p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
